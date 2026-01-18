const Minio = require('minio');
const path = require('path');
const crypto = require('crypto');

const endPoint = process.env.MINIO_ENDPOINT || 'minio';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);
const useSSL = process.env.MINIO_USE_SSL === 'true';
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
const bucket = process.env.MINIO_BUCKET || 'media';

function normalizeBase(url) {
  return url.replace(/\/+$/, '');
}

const client = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey,
  secretKey
});

async function ensureBucket() {
  const exists = await client.bucketExists(bucket).catch(() => false);
  if (!exists) {
    await client.makeBucket(bucket);
  }
}

function buildFileUrl(objectName) {
  const publicBase =
    process.env.MINIO_PUBLIC_URL ||
    `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`;
  const base = normalizeBase(publicBase);
  return `${base}/${bucket}/${encodeURIComponent(objectName)}`;
}

async function uploadFile(buffer, originalName, mimeType) {
  if (!buffer || !buffer.length) {
    throw new Error('Invalid file buffer');
  }
  const ext = path.extname(originalName) || '';
  const objectName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  await client.putObject(bucket, objectName, buffer, buffer.length, { 'Content-Type': mimeType });
  const url = buildFileUrl(objectName);
  if (!url) {
    throw new Error('Failed to build file URL');
  }
  return url;
}

module.exports = {
  client,
  ensureBucket,
  uploadFile,
  bucket
};
