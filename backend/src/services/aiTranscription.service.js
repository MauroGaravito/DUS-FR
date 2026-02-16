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

  const { buffer, contentType } = await readObjectAsBuffer(objectName);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const model = (process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe').trim() || 'gpt-4o-mini-transcribe';

  try {
    // Use native fetch/FormData to avoid SDK path issues
    const form = new FormData();
    form.append('model', model);
    form.append('file', new Blob([buffer], { type: contentType || 'audio/mpeg' }), 'audio.mp3');
    form.append('prompt', PROMPT);
    // `gpt-4o-mini-transcribe*` rejects `verbose_json` (supports `json` or `text`).
    form.append('response_format', 'json');

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form
    });

    if (!resp.ok) {
      const errorBody = await resp.text();
      throw new Error(`OpenAI transcription failed: ${resp.status} ${resp.statusText} - ${errorBody}`);
    }

    const raw = await resp.text();
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
      model,
      language: detectedLanguage
    };
  } catch (err) {
    console.error('OpenAI transcription error', err);
    throw new Error(`OpenAI transcription failed: ${err.message || err.toString()}`);
  }
}

module.exports = { requestTranscription };
