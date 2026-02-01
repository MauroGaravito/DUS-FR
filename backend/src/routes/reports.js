const express = require('express');
const Visit = require('../models/Visit');
const Entry = require('../models/Entry');
const Report = require('../models/Report');
const { generateAIReport } = require('../ai/engine/reportEngine');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const DETERMINISTIC_REPORT_TYPE = 'deterministic';
const AI_REPORT_TYPE = 'ai';

function buildReportContent(visit, entries) {
  const header = `# Visit Report\nProject: ${visit.projectName}\nLocation: ${visit.location}\nStatus: ${visit.status}\nGenerated: ${new Date().toISOString()}\n`;

  const acceptedTexts = entries.filter((e) => e.type === 'text');
  const observationsList = acceptedTexts.filter((e) => !e.isFinding);
  const findingsList = acceptedTexts.filter((e) => e.isFinding);

  const observations =
    observationsList.map((e) => `- ${e.text || e.transcription || 'No content'}`).join('\n') ||
    'No observations recorded.';

  const findings =
    findingsList.map((e) => `- ${e.text || e.transcription || 'Finding noted'}`).join('\n') ||
    'No findings flagged.';

  const annexEntries = entries.filter((e) => e.type === 'audio' || e.type === 'photo');
  const annexLines = annexEntries.map((e) => `- ${e.type.toUpperCase()}: ${e.fileUrl || 'N/A'}`);
  const annexes = annexLines.length > 0 ? annexLines.join('\n') : 'No annexes recorded.';

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
    { visitId: visit._id, type: DETERMINISTIC_REPORT_TYPE },
    { content, type: DETERMINISTIC_REPORT_TYPE, generatedAt: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ report });
}));

router.get('/visits/:id/report', auth, asyncHandler(async (req, res) => {
  const report = await Report.findOne({ visitId: req.params.id, type: DETERMINISTIC_REPORT_TYPE });
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }
  res.json({ report });
}));

function buildAIContext(visit, entries, industry) {
  const textEntries = entries
    .filter((entry) => entry.type === 'text')
    .map((entry) => ({ content: entry.text || '', isFinding: !!entry.isFinding }));

  const audioEntries = entries
    .filter((entry) => entry.type === 'audio')
    .map((entry) => ({
      transcription: entry.transcription && entry.transcription.trim() ? entry.transcription : 'Transcription unavailable'
    }));

  const imageEntries = entries
    .filter((entry) => entry.type === 'photo')
    .map((entry) => ({ description: entry.text || '' }));

  return {
    visit: {
      projectName: visit.projectName,
      location: visit.location,
      createdAt: visit.createdAt
    },
    entries: {
      text: textEntries,
      audio: audioEntries,
      images: imageEntries
    },
    metadata: {
      industry: industry || undefined,
      language: 'en-AU',
      country: 'AU'
    }
  };
}

router.post('/visits/:id/generate-ai-report', auth, asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) {
    return res.status(404).json({ message: 'Visit not found' });
  }

  const entries = await Entry.find({ visitId: visit._id, status: 'accepted', deleted: false }).sort({ createdAt: 1 });
  if (!entries.length) {
    return res.status(400).json({ message: 'Cannot generate report: no accepted entries' });
  }

  const requestedIndustry = typeof req.body?.industry === 'string' ? req.body.industry.trim() : '';
  const context = buildAIContext(visit, entries, requestedIndustry);

  try {
    const aiReport = await generateAIReport(context, {
      industry: context.metadata.industry,
      promptVersion: 'v1',
      temperature: 0.2
    });

    const report = await Report.findOneAndUpdate(
      { visitId: visit._id, type: AI_REPORT_TYPE },
      {
        content: JSON.stringify(aiReport.output, null, 2),
        type: AI_REPORT_TYPE,
        model: aiReport.model,
        promptVersion: aiReport.promptVersion,
        generatedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ report });
  } catch (error) {
    console.error('AI report generation error', error);
    res.status(500).json({ message: 'AI report generation failed' });
  }
}));

module.exports = router;
