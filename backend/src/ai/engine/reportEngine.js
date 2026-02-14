const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const reportSchema = require('../schemas/reportOutput.schema.json');

const PROMPT_DIR = path.join(__dirname, '..', 'prompts');
const ALLOWED_MODELS = new Set(['gpt-4o', 'gpt-4.1']);
const LANGUAGE_NAME_MAP = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese'
};

function loadPrompt(industry, version) {
  const safeIndustry = (industry || 'construction').trim().toLowerCase();
  const safeVersion = (version || 'v1').trim().toLowerCase();
  const filename = `${safeIndustry}.${safeVersion}.md`;
  const filePath = path.join(PROMPT_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return {
    content,
    promptVersion: `${safeIndustry}.${safeVersion}`
  };
}

function injectContext(prompt, context) {
  const contextJson = JSON.stringify(context, null, 2);
  return prompt.replace('{{AI_CONTEXT_JSON}}', contextJson);
}

function resolveLanguageName(languageCode) {
  if (!languageCode || typeof languageCode !== 'string') return LANGUAGE_NAME_MAP.en;
  return LANGUAGE_NAME_MAP[languageCode.toLowerCase()] || LANGUAGE_NAME_MAP.en;
}

function injectLanguageInstruction(prompt, languageCode) {
  const languageName = resolveLanguageName(languageCode);
  const instruction = [
    '',
    `Language instruction: You MUST generate the entire report strictly in ${languageName}.`,
    `All headings, sections, findings, and recommendations must be written in ${languageName}.`,
    'Do not mix languages.'
  ].join('\n');
  return `${prompt}\n${instruction}`;
}

function isPrivateHost(hostname) {
  if (!hostname) return true;
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
    return true;
  }
  if (host.endsWith('.local')) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split('.').map((n) => parseInt(n, 10));
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    return !isPrivateHost(parsed.hostname);
  } catch {
    return false;
  }
}

function buildImageMessage(images) {
  const items = Array.isArray(images) ? images : [];
  const imageUrls = items.map((img) => img && img.url).filter(isValidImageUrl);
  if (!imageUrls.length) return null;
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'Image inputs are attached for context. If any image is inaccessible, note this in limitations.'
      },
      ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } }))
    ]
  };
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function validateReportOutput(output) {
  if (!isPlainObject(output)) {
    throw new Error('AI output is not an object');
  }

  const required = reportSchema.required || [];
  for (const field of required) {
    if (!(field in output)) {
      throw new Error(`AI output missing required field: ${field}`);
    }
  }

  if (typeof output.executiveSummary !== 'string') {
    throw new Error('AI output executiveSummary must be a string');
  }
  if (!Array.isArray(output.observations) || !output.observations.every((item) => typeof item === 'string')) {
    throw new Error('AI output observations must be an array of strings');
  }
  if (!Array.isArray(output.findings)) {
    throw new Error('AI output findings must be an array');
  }

  const severityEnum =
    reportSchema.properties?.findings?.items?.properties?.severity?.enum || ['low', 'medium', 'high'];

  output.findings.forEach((finding, index) => {
    if (!isPlainObject(finding)) {
      throw new Error(`AI output finding at index ${index} must be an object`);
    }
    const { title, severity, evidence, recommendation } = finding;
    if (typeof title !== 'string') {
      throw new Error(`AI output finding ${index} title must be a string`);
    }
    if (typeof severity !== 'string' || !severityEnum.includes(severity)) {
      throw new Error(`AI output finding ${index} severity must be one of ${severityEnum.join(', ')}`);
    }
    if (typeof evidence !== 'string') {
      throw new Error(`AI output finding ${index} evidence must be a string`);
    }
    if (typeof recommendation !== 'string') {
      throw new Error(`AI output finding ${index} recommendation must be a string`);
    }
  });

  if (typeof output.limitations !== 'string') {
    throw new Error('AI output limitations must be a string');
  }
  if (typeof output.conclusion !== 'string') {
    throw new Error('AI output conclusion must be a string');
  }

  const allowedKeys = Object.keys(reportSchema.properties || {});
  const outputKeys = Object.keys(output);
  const extraKeys = outputKeys.filter((key) => !allowedKeys.includes(key));
  if (extraKeys.length) {
    throw new Error(`AI output contains unsupported fields: ${extraKeys.join(', ')}`);
  }
}

async function generateAIReport(context, config = {}) {
  if (!context) {
    throw new Error('AI context is required');
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const industry = config.industry || context?.metadata?.industry || 'forestry';
  const language = config.language || context?.metadata?.language || 'en';
  const promptVersion = config.promptVersion || 'v1';
  const { content: promptTemplate, promptVersion: resolvedPromptVersion } = loadPrompt(industry, promptVersion);
  const promptWithContext = injectContext(promptTemplate, context);
  const prompt = injectLanguageInstruction(promptWithContext, language);

  const model = (process.env.OPENAI_REPORT_MODEL || 'gpt-4o').trim() || 'gpt-4o';
  if (!ALLOWED_MODELS.has(model)) {
    throw new Error(`Unsupported OpenAI report model: ${model}`);
  }

  const client = new OpenAI({ apiKey });

  const messages = [{ role: 'system', content: prompt }];
  const imageMessage = buildImageMessage(context?.entries?.images);
  if (imageMessage) {
    messages.push(imageMessage);
  }

  const response = await client.chat.completions.create({
    model,
    temperature: typeof config.temperature === 'number' ? config.temperature : 0.2,
    response_format: { type: 'json_object' },
    messages
  });

  const rawContent = response?.choices?.[0]?.message?.content;
  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('OpenAI returned empty response');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    throw new Error('OpenAI response is not valid JSON');
  }

  validateReportOutput(parsed);

  return {
    output: parsed,
    model,
    promptVersion: resolvedPromptVersion
  };
}

module.exports = { generateAIReport };
