const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { client, bucket, extractObjectName } = require('../utils/minio');

const PROMPT = `
You are a transcription engine.

Your task is to transcribe the provided audio into plain text.

Rules:
- Transcribe the audio verbatim, exactly as spoken.
- Do NOT summarize.
- Do NOT interpret or analyze the content.
- Do NOT translate the language.
- Do NOT correct grammar or wording.
- Preserve technical terms, brand names, and numbers exactly as spoken.
- Ignore background noise and non-speech sounds.
- Output ONLY the transcription text.
`.trim();

function normalizeLanguage(value) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim().toLowerCase();
  const direct = new Set(['en', 'es', 'pt']);
  if (direct.has(raw)) return raw;
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('es') || raw.includes('spanish') || raw.includes('espa')) return 'es';
  if (raw.startsWith('pt') || raw.includes('portugu')) return 'pt';
  return null;
}

function extractFilename(objectName) {
  const fallback = 'audio.webm';
  if (!objectName || typeof objectName !== 'string') return fallback;
  const parts = objectName.split('/').filter(Boolean);
  const candidate = parts[parts.length - 1] || fallback;
  return candidate.includes('.') ? candidate : `${candidate}.webm`;
}

function normalizeTranscriptionMime(contentType, filename) {
  const raw = String(contentType || '').trim().toLowerCase();
  if (raw === 'audio/x-m4a') return 'audio/m4a';
  if (raw === 'application/mp4') return 'audio/mp4';
  if (raw) return raw;

  const lower = String(filename || '').toLowerCase();
  if (lower.endsWith('.m4a')) return 'audio/m4a';
  if (lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  return 'audio/webm';
}

function listUnique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildMimeCandidates(contentType, filename) {
  const lower = String(filename || '').toLowerCase();
  const normalized = normalizeTranscriptionMime(contentType, filename);
  const candidates = [normalized];

  if (lower.endsWith('.m4a')) {
    candidates.push('audio/m4a', 'audio/mp4', 'application/octet-stream');
  } else if (lower.endsWith('.mp4')) {
    candidates.push('audio/mp4', 'video/mp4', 'application/octet-stream');
  } else if (lower.endsWith('.aac')) {
    candidates.push('audio/aac', 'audio/mp4', 'application/octet-stream');
  } else {
    candidates.push('application/octet-stream');
  }

  return listUnique(candidates);
}

function buildModelCandidates(baseModel) {
  return listUnique([baseModel, 'gpt-4o-mini-transcribe', 'whisper-1']);
}

function isRetryableTranscriptionError(err) {
  const body = String(err?.body || err?.message || '');
  const isTimeout = String(err?.name || '').toLowerCase() === 'aborterror';
  const isInvalidFileParam = /"param"\s*:\s*"file"/i.test(body);
  const saysUnsupported = /audio file might be corrupted or unsupported/i.test(body);
  const saysInvalidFormat = /invalid file format/i.test(body);
  return isTimeout || (err?.status === 400 && (isInvalidFileParam || saysUnsupported || saysInvalidFormat));
}

function toWavFilename(filename) {
  const ext = path.extname(filename || '');
  if (!ext) return `${filename || 'audio'}.wav`;
  return `${filename.slice(0, -ext.length)}.wav`;
}

async function transcodeToWav(buffer, filename) {
  const tmpDir = os.tmpdir();
  const token = crypto.randomUUID();
  const sourceExt = path.extname(filename || '').toLowerCase() || '.bin';
  const inputPath = path.join(tmpDir, `dus-fr-audio-${token}${sourceExt}`);
  const outputPath = path.join(tmpDir, `dus-fr-audio-${token}.wav`);

  try {
    await fs.writeFile(inputPath, buffer);
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        inputPath,
        '-ac',
        '1',
        '-ar',
        '16000',
        '-f',
        'wav',
        outputPath
      ]);

      let stderr = '';
      ffmpeg.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      ffmpeg.on('error', (err) => reject(err));
      ffmpeg.on('close', (code) => {
        if (code === 0) return resolve();
        return reject(new Error(stderr || `ffmpeg exited with code ${code}`));
      });
    });

    const wavBuffer = await fs.readFile(outputPath);
    return { buffer: wavBuffer, filename: toWavFilename(filename), mime: 'audio/wav' };
  } catch (error) {
    console.warn(`Audio transcode to wav failed for ${filename}: ${error.message}`);
    return null;
  } finally {
    await Promise.allSettled([fs.unlink(inputPath), fs.unlink(outputPath)]);
  }
}

async function attemptTranscription({
  apiKey,
  buffer,
  filename,
  mimeCandidates,
  modelCandidates,
  timeoutMs
}) {
  let raw = null;
  let lastError = null;
  let usedModel = modelCandidates[0];

  for (const candidateModel of modelCandidates) {
    for (const candidateMime of mimeCandidates) {
      try {
        raw = await sendTranscriptionRequest({
          apiKey,
          model: candidateModel,
          buffer,
          mime: candidateMime,
          filename,
          timeoutMs
        });
        usedModel = candidateModel;
        if (candidateModel !== modelCandidates[0] || candidateMime !== mimeCandidates[0]) {
          console.warn(
            `OpenAI transcription succeeded with fallback model=${candidateModel} mime=${candidateMime} filename=${filename}`
          );
        }
        return { raw, usedModel };
      } catch (err) {
        lastError = err;
        if (!isRetryableTranscriptionError(err)) {
          throw err;
        }
        console.warn(
          `OpenAI transcription retry model=${candidateModel} mime=${candidateMime} filename=${filename}: ${err.message}`
        );
      }
    }
  }

  throw lastError || new Error('OpenAI transcription failed for all mime/model candidates');
}

async function sendTranscriptionRequest({
  apiKey,
  model,
  buffer,
  mime,
  filename,
  timeoutMs
}) {
  const form = new FormData();
  form.append('model', model);
  form.append('file', new Blob([buffer], { type: mime }), filename);
  form.append('prompt', PROMPT);
  form.append('response_format', 'json');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form,
      signal: controller.signal
    });

    const raw = await resp.text();
    if (!resp.ok) {
      const error = new Error(`OpenAI transcription failed: ${resp.status} ${resp.statusText} - ${raw}`);
      error.status = resp.status;
      error.body = raw;
      throw error;
    }

    return raw;
  } finally {
    clearTimeout(timer);
  }
}

async function readObjectAsBuffer(objectName) {
  const stat = await client.statObject(bucket, objectName);
  const stream = await client.getObject(bucket, objectName);
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () =>
      resolve({ buffer: Buffer.concat(chunks), contentType: stat.contentType || 'audio/mpeg' })
    );
    stream.on('error', (err) => reject(err));
  });
}

async function requestTranscription(entry) {
  if (!entry || entry.type !== 'audio') {
    const error = new Error('Transcription supported only for audio entries');
    error.code = 'UNSUPPORTED_TYPE';
    throw error;
  }
  const objectName = extractObjectName(entry.fileUrl);
  if (!objectName) {
    throw new Error('Cannot derive media object for transcription');
  }
  const filename = extractFilename(objectName);

  const { buffer, contentType } = await readObjectAsBuffer(objectName);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const model =
    (process.env.OPENAI_TRANSCRIBE_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini-transcribe').trim() ||
    'gpt-4o-mini-transcribe';
  const timeoutMs = Math.max(parseInt(process.env.OPENAI_TIMEOUT_MS || '60000', 10) || 60000, 5000);

  try {
    const mimeCandidates = buildMimeCandidates(contentType, filename);
    const modelCandidates = buildModelCandidates(model);
    let result = null;

    try {
      result = await attemptTranscription({
        apiKey,
        buffer,
        filename,
        mimeCandidates,
        modelCandidates,
        timeoutMs
      });
    } catch (err) {
      if (!isRetryableTranscriptionError(err)) {
        throw err;
      }

      const transcoded = await transcodeToWav(buffer, filename);
      if (!transcoded) {
        throw err;
      }

      console.warn(`Retrying transcription with transcoded wav for ${filename}`);
      result = await attemptTranscription({
        apiKey,
        buffer: transcoded.buffer,
        filename: transcoded.filename,
        mimeCandidates: [transcoded.mime, 'application/octet-stream'],
        modelCandidates,
        timeoutMs
      });
    }

    const { raw, usedModel } = result;
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_error) {
      parsed = null;
    }

    const text = typeof parsed?.text === 'string' ? parsed.text : raw;
    if (!text || !text.trim()) {
      throw new Error('OpenAI returned empty transcription');
    }

    const detectedLanguage = normalizeLanguage(parsed?.language);

    return {
      text: text.trim(),
      completedAt: new Date(),
      model: parsed?.model || usedModel || model,
      language: detectedLanguage
    };
  } catch (err) {
    console.error('OpenAI transcription error', err);
    throw new Error(`OpenAI transcription failed: ${err.message || err.toString()}`);
  }
}

module.exports = { requestTranscription };
