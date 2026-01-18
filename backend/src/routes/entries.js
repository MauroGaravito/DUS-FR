const express = require('express');
const multer = require('multer');
const Visit = require('../models/Visit');
const Entry = require('../models/Entry');
const auth = require('../middleware/auth');
const { uploadFile } = require('../utils/minio');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_AUDIO_MIME = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm']);
const ALLOWED_PHOTO_MIME = new Set(['image/jpeg', 'image/png']);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_AUDIO_BYTES } });

function runUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File exceeds maximum size (10 MB for audio, 5 MB for photos)' });
    }
    if (err) {
      return res.status(400).json({ message: 'Invalid file upload' });
    }
    return next();
  });
}

function validateTextContent(text) {
  return typeof text === 'string' && text.trim().length >= 5;
}

router.post('/visits/:id/entries', auth, runUpload, asyncHandler(async (req, res) => {
  const { type, text, transcription, isFinding } = req.body;
  if (!type || !['audio', 'text', 'photo'].includes(type)) {
    return res.status(400).json({ message: 'Invalid entry type' });
  }

  const visit = await Visit.findById(req.params.id);
  if (!visit) {
    return res.status(404).json({ message: 'Visit not found' });
  }

  let fileUrl;
  if (['audio', 'photo'].includes(type)) {
    if (!req.file) {
      return res.status(400).json({ message: 'file is required for audio/photo entries' });
    }

    if (type === 'audio') {
      if (!ALLOWED_AUDIO_MIME.has(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid audio type. Allowed: audio/mpeg, audio/mp3, audio/wav, audio/webm' });
      }
      if (req.file.size > MAX_AUDIO_BYTES) {
        return res.status(400).json({ message: 'Audio exceeds 10 MB limit' });
      }
    }

    if (type === 'photo') {
      if (!ALLOWED_PHOTO_MIME.has(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid photo type. Allowed: image/jpeg, image/png' });
      }
      if (req.file.size > MAX_PHOTO_BYTES) {
        return res.status(400).json({ message: 'Photo exceeds 5 MB limit' });
      }
    }

    try {
      fileUrl = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    } catch (error) {
      console.error('MinIO upload failed', error);
      return res.status(500).json({ message: 'Failed to store file in MinIO' });
    }

    if (!fileUrl || !String(fileUrl).trim()) {
      return res.status(500).json({ message: 'Failed to store file in MinIO' });
    }
  }

  if (type === 'text') {
    if (!validateTextContent(text)) {
      return res.status(400).json({ message: 'Text must be at least 5 characters' });
    }
  }

  const status = type === 'audio' ? 'pending' : 'accepted';
  const entry = await Entry.create({
    visitId: visit._id,
    type,
    fileUrl,
    text,
    transcription,
    status,
    isFinding: isFinding === 'true' || isFinding === true
  });

  res.status(201).json({ entry });
}));

router.get('/visits/:id/entries', auth, asyncHandler(async (req, res) => {
  const entries = await Entry.find({ visitId: req.params.id, deleted: false }).sort({ createdAt: -1 });
  res.json({ entries });
}));

router.patch('/entries/:id', auth, asyncHandler(async (req, res) => {
  const allowed = ['status', 'text', 'transcription', 'isFinding', 'edited', 'deleted'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.status && !['pending', 'accepted', 'rejected'].includes(updates.status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  if (updates.isFinding !== undefined) {
    updates.isFinding = updates.isFinding === 'true' || updates.isFinding === true;
  }
  if (updates.deleted !== undefined) {
    updates.deleted = updates.deleted === 'true' || updates.deleted === true;
  }

  const entry = await Entry.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ message: 'Entry not found' });
  }

  if (updates.status) {
    if (entry.type !== 'audio') {
      if (updates.status !== 'accepted') {
        return res.status(400).json({ message: 'Text and photo entries must remain accepted' });
      }
      updates.status = 'accepted';
    } else {
      if (entry.status === 'accepted' && updates.status === 'rejected') {
        return res.status(400).json({ message: 'Cannot reject an accepted audio entry' });
      }
      if (entry.status === 'rejected' && updates.status === 'accepted') {
        return res.status(400).json({ message: 'Cannot accept a rejected audio entry' });
      }
    }
  }

  if (entry.type === 'text' && updates.text !== undefined && !validateTextContent(updates.text)) {
    return res.status(400).json({ message: 'Text must be at least 5 characters' });
  }

  Object.assign(entry, updates);
  const saved = await entry.save();
  res.json({ entry: saved });
}));

module.exports = router;
