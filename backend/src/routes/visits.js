const express = require('express');
const Visit = require('../models/Visit');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', auth, asyncHandler(async (req, res) => {
  const { projectName, location, status } = req.body;
  if (!projectName || !location) {
    return res.status(400).json({ message: 'projectName and location are required' });
  }

  const visit = await Visit.create({
    projectName,
    location,
    status: status || 'draft',
    createdBy: req.user.id
  });

  res.status(201).json({ visit });
}));

router.get('/', auth, asyncHandler(async (_req, res) => {
  const visits = await Visit.find().sort({ createdAt: -1 });
  res.json({ visits });
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) {
    return res.status(404).json({ message: 'Visit not found' });
  }
  res.json({ visit });
}));

router.patch('/:id', auth, asyncHandler(async (req, res) => {
  const allowed = ['projectName', 'location', 'status'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.status && !['draft', 'final'].includes(updates.status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const visit = await Visit.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!visit) {
    return res.status(404).json({ message: 'Visit not found' });
  }
  res.json({ visit });
}));

module.exports = router;
