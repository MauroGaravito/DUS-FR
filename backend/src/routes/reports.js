const express = require('express');
const Visit = require('../models/Visit');
const Entry = require('../models/Entry');
const Report = require('../models/Report');
const { generateAIReport } = require('../ai/engine/reportEngine');
const { getPresignedUrl } = require('../utils/minio');
const { requestTranscription } = require('../services/aiTranscription.service');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const DETERMINISTIC_REPORT_TYPE = 'deterministic';
const AI_REPORT_TYPE = 'ai';
const ALLOWED_REPORT_TYPES = new Set([DETERMINISTIC_REPORT_TYPE, AI_REPORT_TYPE]);

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
  const requestedType = typeof req.query?.type === 'string' ? req.query.type.trim().toLowerCase() : '';
  const type = requestedType || DETERMINISTIC_REPORT_TYPE;

  if (!ALLOWED_REPORT_TYPES.has(type)) {
    return res.status(400).json({ message: 'Invalid report type' });
  }

  const report = await Report.findOne({ visitId: req.params.id, type });
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }
  res.json({ report });
}));

router.patch('/reports/:id', auth, asyncHandler(async (req, res) => {
  const { content } = req.body || {};

  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ message: 'content is required' });
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  if (report.type === AI_REPORT_TYPE) {
    try {
      JSON.parse(content);
    } catch (_error) {
      return res.status(400).json({ message: 'AI report content must be valid JSON' });
    }
  }

  report.content = content;
  report.generatedAt = new Date();
  await report.save();

  res.json({ report });
}));

async function buildAIContext(visit, entries, industry, language) {
  const textEntries = entries
    .filter((entry) => entry.type === 'text')
    .map((entry) => ({ content: entry.text || '', isFinding: !!entry.isFinding }));

  const rawAudioEntries = entries.filter((entry) => entry.type === 'audio');
  const audioEntries = rawAudioEntries
    .filter((entry) => entry.type === 'audio')
    .map((entry) => ({
      transcription: entry.transcription && entry.transcription.trim() ? entry.transcription : 'Transcription unavailable'
    }));
  const doneAudioEntries = rawAudioEntries.filter((entry) => entry.transcriptionStatus === 'done');
  const sampleTranscription =
    audioEntries.find((entry) => entry.transcription && entry.transcription !== 'Transcription unavailable')
      ?.transcription || '';
  console.log(
    `AI context audio entries: accepted=${rawAudioEntries.length} done=${doneAudioEntries.length} sample="${sampleTranscription.slice(
      0,
      200
    )}"`
  );

  const imageEntries = await Promise.all(
    entries
      .filter((entry) => entry.type === 'photo')
      .map(async (entry) => {
        let url = entry.fileUrl || null;
        if (url) {
          try {
            url = await getPresignedUrl(url, 3600);
          } catch (err) {
            console.error('Failed to build presigned image URL', err);
          }
        }
        return {
          url,
          description: entry.text || ''
        };
      })
  );

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
      language: language || 'en',
      country: 'AU'
    }
  };
}

async function transcribeAcceptedAudioEntries(entries) {
  const audioEntries = entries.filter((entry) => entry.type === 'audio');
  for (const entry of audioEntries) {
    if (entry.transcriptionStatus === 'done') {
      continue;
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
      console.log(`Audio transcription completed for entry ${entry._id} using ${result.model}`);
    } catch (error) {
      entry.transcriptionStatus = 'error';
      entry.transcriptionError = error.message || 'Transcription failed';
      await entry.save();
      console.error(
        `Audio transcription failed for entry ${entry._id}: ${entry.transcriptionError}`
      );
    }
  }
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
  const requestedLanguage = typeof req.body?.language === 'string' ? req.body.language.trim().toLowerCase() : '';
  const language = ['en', 'es', 'pt'].includes(requestedLanguage) ? requestedLanguage : 'en';
  await transcribeAcceptedAudioEntries(entries);
  const context = await buildAIContext(visit, entries, requestedIndustry, language);

  try {
    const aiReport = await generateAIReport(context, {
      industry: context.metadata.industry,
      language: context.metadata.language,
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
