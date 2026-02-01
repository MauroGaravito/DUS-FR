const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
    type: { type: String, enum: ['deterministic', 'ai'], default: 'deterministic', required: true },
    content: { type: String, required: true },
    model: { type: String },
    promptVersion: { type: String },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

reportSchema.index({ visitId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
