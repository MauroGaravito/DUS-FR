# DUS Field Report Backend Reference

Backend role:

- Authenticates users.
- Stores domain entities.
- Manages media upload and streaming.
- Generates deterministic and AI reports.

## Technology

- Node.js + Express
- Mongoose (MongoDB ODM)
- JWT auth middleware
- Multer (memory upload buffers)
- MinIO SDK
- OpenAI SDK (transcription and report generation pipeline)

## Key Folders

- `backend/src/index.js` - bootstrap, middleware, routes, DB and MinIO init
- `backend/src/routes/` - route modules for auth/users/visits/entries/reports
- `backend/src/models/` - `User`, `Visit`, `Entry`, `Report`
- `backend/src/middleware/` - JWT guard and auth helpers
- `backend/src/services/` - AI transcription service
- `backend/src/ai/` - prompt files, schema and AI engine
- `backend/src/utils/` - MinIO helpers, async wrapper, seed script

## Endpoint Coverage

- Auth: `POST /auth/login`
- Health: `GET /health`
- Users: `GET /users/me`
- Visits: `POST /visits`, `GET /visits`, `GET /visits/:id`, `PATCH /visits/:id`
- Entries: `POST /visits/:id/entries`, `GET /visits/:id/entries`, `PATCH /entries/:id`
- Transcription: `POST /entries/:id/transcribe`
- Media proxy: `GET /media/:objectName`
- Reports: `POST /visits/:id/generate-report`, `POST /visits/:id/generate-ai-report`, `GET /visits/:id/report`

## Core Models

- User: `name`, `email`, `passwordHash`, `role`
- Visit: `projectName`, `location`, `status`, `createdBy`, timestamps
- Entry: `visitId`, `type`, `text`, `fileUrl`, `status`, `isFinding`, transcription fields, soft-delete flag
- Report: `visitId`, `content`, `type`, `model`, `promptVersion`, timestamps

## Media and Storage Strategy

- Binaries are never stored in MongoDB.
- Upload flow: request -> multer memory buffer -> MinIO object -> Mongo metadata.
- Frontend plays media via backend proxy path, not direct bucket access.

## AI Reporting and Transcription

- Prompt files under `backend/src/ai/prompts/`.
- Output constrained by JSON schema in `backend/src/ai/schemas/reportOutput.schema.json`.
- AI engine validates output shape before persisting report record.
- Transcription endpoint updates entry transcription fields and statuses.

## Error Handling

- Validation errors: `400`
- Auth errors: `401`
- Missing resources: `404`
- Internal errors: `500` with generic client-safe message

