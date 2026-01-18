const express = require('express');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/me', auth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

module.exports = router;
