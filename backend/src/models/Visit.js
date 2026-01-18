const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['draft', 'final'], default: 'draft' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visit', visitSchema);
