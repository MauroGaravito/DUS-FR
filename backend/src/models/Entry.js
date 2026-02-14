const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
    type: { type: String, enum: ['audio', 'text', 'photo'], required: true },
    fileUrl: { type: String },
    text: { type: String },
    transcription: { type: String },
    transcriptionStatus: {
      type: String,
      enum: ['idle', 'processing', 'done', 'error'],
      default: 'idle'
    },
    transcriptionError: { type: String },
    transcriptionLanguage: { type: String, enum: ['en', 'es', 'pt'], default: null },
    transcribedAt: { type: Date },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    isFinding: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Entry', entrySchema);
