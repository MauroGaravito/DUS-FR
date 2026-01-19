# Backend

Node.js + Express API providing authentication, visit/entry management, report generation, and media handling via MinIO.

## Folder structure
- `src/index.js` — app bootstrap, DB + MinIO init, routing
- `src/routes/` — auth, users, visits, entries, reports
- `src/models/` — `User`, `Visit`, `Entry`, `Report` Mongoose schemas
- `src/middleware/` — JWT auth guard
- `src/utils/` — MinIO client helpers and user seeding
- `src/services/` — AI transcription placeholder

## API overview
- Auth: `POST /auth/login`
- Users: `GET /users/me`
- Visits: `POST /visits`, `GET /visits`, `GET /visits/:id`, `PATCH /visits/:id`
- Entries: `POST /visits/:id/entries`, `GET /visits/:id/entries`, `PATCH /entries/:id`, `POST /entries/:id/transcribe`
- Reports: `POST /visits/:id/generate-report`, `GET /visits/:id/report`

## Auth flow
- Credentials exchanged at `POST /auth/login`.
- On success, returns JWT signed with `JWT_SECRET`.
- Frontend stores token and sends `Authorization: Bearer <token>` for protected routes.
- `GET /users/me` resolves the current user from the token.

## Models
- **User**: `name`, `email`, `passwordHash`, `role ("engineer"|"manager")`
- **Visit**: `projectName`, `location`, `status ("draft"|"final")`, `createdBy`, `createdAt`
- **Entry**: `visitId`, `type ("audio"|"text"|"photo")`, `fileUrl`, `text`, `transcription` (editable), `transcriptionStatus ("idle"|"processing"|"done"|"error")`, `transcriptionError`, `transcribedAt`, `status ("pending"|"accepted"|"rejected")`, `isFinding`, `edited`, `deleted`, `createdAt`
- **Report**: `visitId`, `content` (Markdown), `generatedAt`

## Media storage (MinIO)
- Binary uploads handled with `multer` (memory storage) and pushed to MinIO via the `minio` SDK.
- Only file metadata + URL is stored in MongoDB.
- Bucket name comes from `MINIO_BUCKET` and is created on boot if missing.
- Public URLs are built from `MINIO_PUBLIC_URL` (defaults to the MinIO service/port).

## Error handling philosophy
- Input validation returns `400` with a simple `{ message }`.
- Missing resources return `404`.
- Auth issues return `401`.
- Uncaught errors bubble to a last-resort 500 handler with a generic response; server logs capture details.
