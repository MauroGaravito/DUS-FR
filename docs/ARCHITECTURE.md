# Architecture

## System diagram (textual)
- Browser (React + Vite) ⇄ Backend API (Express)
- Backend → MongoDB for users/visits/entries/reports
- Backend → MinIO for audio/photo binaries (stores URLs in Mongo)

## Data flow
1. User authenticates, receives JWT.
2. User creates a Visit.
3. User adds Entries (text straight to Mongo, audio/photo buffered then uploaded to MinIO; URLs stored).
4. User accepts/rejects pending audio.
5. Backend generates Report from accepted, non-deleted entries and persists it.

## Audio lifecycle
`upload` → `pending` → user action (`accepted` | `rejected`) → only `accepted` entries are included in reports; `deleted` is soft-only.

## Why Mongo + MinIO
- MongoDB handles flexible schemas for entries and reports without migrations.
- MinIO provides S3-compatible storage for binaries so the database stays lean and portable.

## Why AI is deferred
- MVP favors deterministic, reviewable reports derived from user-approved entries. Automated transcription/analysis can be layered later once workflows are validated.

## Development notes
- Services are isolated via Docker Compose; internal hostnames follow service names (e.g., `mongo`, `minio`, `backend`).
- JWT middleware guards all routes except login; a seeded engineer account simplifies first-run access.
