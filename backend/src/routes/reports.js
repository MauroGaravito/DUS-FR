const express = require('express');
const Visit = require('../models/Visit');
const Entry = require('../models/Entry');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

function buildReportContent(visit, entries) {
  const header = `# Visit Report\nProject: ${visit.projectName}\nLocation: ${visit.location}\nStatus: ${visit.status}\nGenerated: ${new Date().toISOString()}\n`;

  const observations = entries
    .filter((e) => e.type === 'text' && !e.isFinding)
    .map((e) => `- ${e.text || e.transcription || 'No content'}`)
    .join('\n') || 'No observations recorded.';

  const findings = entries
    .filter((e) => e.isFinding)
    .map((e) => `- ${e.text || e.transcription || 'Finding noted'}`)
    .join('\n') || 'No findings flagged.';

  const annexLines = entries
    .filter((e) => e.type !== 'text')
    .map((e) => `- ${e.type.toUpperCase()}: ${e.fileUrl || 'N/A'}`);
  const annexes = annexLines.length > 0 ? annexLines.join('\n') : 'No annexes.';

  const objective = 'Site visit summary generated from accepted entries.';

  return [
    header,
    '## Objective',
    objective,
    '## Observations',
    observations,
    '## Findings',
    findings,
    '## Annexes',
    annexes
  ].join('\n\n');
}

router.post('/visits/:id/generate-report', auth, asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) {
    return res.status(404).json({ message: 'Visit not found' });
  }

  const entries = await Entry.find({ visitId: visit._id, status: 'accepted', deleted: false }).sort({ createdAt: 1 });
  if (!entries.length) {
    return res.status(400).json({ message: 'Cannot generate report: no accepted entries' });
  }
  const content = buildReportContent(visit, entries);

  const report = await Report.findOneAndUpdate(
    { visitId: visit._id },
    { content, generatedAt: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ report });
}));

router.get('/visits/:id/report', auth, asyncHandler(async (req, res) => {
  const report = await Report.findOne({ visitId: req.params.id });
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }
  res.json({ report });
}));

module.exports = router;
