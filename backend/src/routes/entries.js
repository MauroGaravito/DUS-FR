const express = require('express');
const multer = require('multer');
const Visit = require('../models/Visit');
const Entry = require('../models/Entry');
const auth = require('../middleware/auth');
const { uploadFile, getPresignedUrl, client, bucket, extractObjectName } = require('../utils/minio');
const asyncHandler = require('../utils/asyncHandler');
const { requestTranscription } = require('../services/aiTranscription.service');

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

const API_BASE =
  (process.env.PUBLIC_API_URL && process.env.PUBLIC_API_URL.replace(/\/+$/, '')) ||
  'http://localhost:4000';

function buildProxyUrl(entry) {
  if (!entry.fileUrl) return null;
  const objectName = extractObjectName(entry.fileUrl);
  if (!objectName) return null;
  return `${API_BASE}/media/${encodeURIComponent(objectName)}`;
}

async function withAccessibleUrl(entryDoc) {
  if (!entryDoc) return entryDoc;
  const entry = entryDoc.toObject ? entryDoc.toObject() : entryDoc;
  if (entry.fileUrl && ['audio', 'photo'].includes(entry.type)) {
    const proxyUrl = buildProxyUrl(entry);
    if (proxyUrl) {
      entry.fileUrl = proxyUrl;
    }
  }
  return entry;
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

  const entryWithUrl = await withAccessibleUrl(entry);
  res.status(201).json({ entry: entryWithUrl });
}));

router.get('/visits/:id/entries', auth, asyncHandler(async (req, res) => {
  const entries = await Entry.find({ visitId: req.params.id, deleted: false }).sort({ createdAt: -1 });
  const withUrls = await Promise.all(entries.map((e) => withAccessibleUrl(e)));
  res.json({ entries: withUrls });
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

  const shouldTriggerTranscription =
    entry.type === 'audio' &&
    updates.status === 'accepted' &&
    entry.status !== 'accepted' &&
    entry.transcriptionStatus !== 'done';

  Object.assign(entry, updates);
  if (shouldTriggerTranscription) {
    entry.transcriptionStatus = 'processing';
    entry.transcriptionError = undefined;
  }
  const saved = await entry.save();

  if (shouldTriggerTranscription) {
    try {
      const result = await requestTranscription(saved);
      saved.transcription = result.text;
      saved.transcriptionLanguage = result.language || null;
      saved.transcriptionStatus = 'done';
      saved.transcribedAt = result.completedAt || new Date();
      await saved.save();
      console.log(`Audio transcription completed for entry ${saved._id} using ${result.model}`);
    } catch (error) {
      console.error(
        `Audio transcription failed for entry ${saved._id}: ${error.message || error.toString()}`
      );
      saved.transcriptionStatus = 'error';
      saved.transcriptionError = error.message || 'Transcription failed';
      await saved.save();
    }
  }

  const entryWithUrl = await withAccessibleUrl(saved);
  res.json({ entry: entryWithUrl });
}));

router.post('/entries/:id/transcribe', auth, asyncHandler(async (req, res) => {
  const entry = await Entry.findById(req.params.id);
  if (!entry || entry.deleted) {
    return res.status(404).json({ message: 'Entry not found' });
  }
  if (entry.type !== 'audio') {
    return res.status(400).json({ message: 'Transcription available only for audio entries' });
  }
  if (entry.transcriptionStatus === 'processing') {
    return res.status(400).json({ message: 'Transcription already in progress' });
  }
  if (entry.transcriptionStatus === 'done') {
    return res.status(400).json({ message: 'Transcription already completed' });
  }

  entry.transcriptionStatus = 'processing';
  entry.transcriptionError = undefined;
  await entry.save();

  try {
    const result = await requestTranscription(entry);
    entry.transcription = result.text;
    entry.transcriptionLanguage = result.language || null;
    entry.transcriptionStatus = 'done';
    entry.transcribedAt = result.completedAt || new Date();
    await entry.save();
    const entryWithUrl = await withAccessibleUrl(entry);
    return res.json({ entry: entryWithUrl });
  } catch (error) {
    entry.transcriptionStatus = 'error';
    entry.transcriptionError = error.message || 'Transcription failed';
    await entry.save();
    return res.status(500).json({ message: 'Transcription failed', error: entry.transcriptionError });
  }
}));

router.get('/media/:objectName', asyncHandler(async (req, res) => {
  const objectName = decodeURIComponent(req.params.objectName);
  try {
    const stat = await client.statObject(bucket, objectName);
    const ct =
      (stat.metaData && (stat.metaData['content-type'] || stat.metaData['Content-Type'])) ||
      stat.contentType ||
      'application/octet-stream';
    res.setHeader('Content-Type', ct);
    if (stat.size) {
      res.setHeader('Content-Length', stat.size);
    }
    const stream = await client.getObject(bucket, objectName);
    stream.on('error', (err) => {
      console.error('Stream error', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to read media' });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch (err) {
    console.error('Media fetch failed', err);
    res.status(404).json({ message: 'Media not found' });
  }
}));

module.exports = router;
