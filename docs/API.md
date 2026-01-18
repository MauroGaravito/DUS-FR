# API

Base URL: `http://localhost:4000`

Authentication: Send `Authorization: Bearer <JWT>` on all endpoints except login.

## Auth
### POST /auth/login
Request:
```json
{ "email": "engineer@example.com", "password": "password123" }
```
Response 200:
```json
{ "token": "jwt", "user": { "id": "...", "name": "...", "email": "...", "role": "engineer" } }
```
Errors: `400` missing fields, `401` invalid credentials.

## Users
### GET /users/me
Response 200:
```json
{ "user": { "id": "...", "name": "...", "email": "...", "role": "engineer" } }
```
Errors: `401` missing/invalid token.

## Visits
### POST /visits
Create a visit.
```json
{ "projectName": "Bridge A", "location": "Site 3", "status": "draft" }
```
Response 201: `{ "visit": { ... } }`
Errors: `400` missing fields.

### GET /visits
List visits. Response 200: `{ "visits": [ ... ] }`

### GET /visits/:id
Fetch a visit. Response 200: `{ "visit": { ... } }`, `404` if not found.

### PATCH /visits/:id
Update fields (`projectName`, `location`, `status`). Response 200: `{ "visit": { ... } }`, `404` if not found, `400` on bad status.

## Entries
### POST /visits/:id/entries
- `type` = `"text" | "audio" | "photo"`
- For `text`, send JSON body: `{ "type": "text", "text": "details", "isFinding": true }`
- For `audio`/`photo`, send `multipart/form-data` with fields `type`, `file` (binary), optional `isFinding`.
- Audio is stored as `pending` until accepted; photos and text default to `accepted`.
- Validation:
  - Text required, minimum 5 characters; empty/short text → `400`.
  - Audio MIME: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/webm`; max 10 MB. Invalid type/size → `400`.
  - Photo MIME: `image/jpeg`, `image/png`; max 5 MB. Invalid type/size → `400`.
  - MinIO upload failures return `500` and entry is not created.
Response 201: `{ "entry": { ... } }`
Errors: `400` invalid type, missing file, invalid content, or failed validation; `404` visit not found.

### GET /visits/:id/entries
List non-deleted entries for a visit. Response 200: `{ "entries": [ ... ] }`

### PATCH /entries/:id
Update entry fields (`status`, `text`, `transcription`, `isFinding`, `edited`, `deleted`).
Response 200: `{ "entry": { ... } }`
Guardrails:
- Only audio entries can be `pending`; text/photo stay `accepted`.
- Cannot reject an already accepted audio entry; cannot accept an already rejected audio entry.
- Text updates must still be at least 5 characters.
Errors: `400` invalid transition/content, `404` entry not found.

### Media access for audio/photo
- `fileUrl` values returned by entry endpoints point to a backend proxy: `GET /media/:objectName`.
- No auth header is required for this proxy so native `<audio>` players can fetch; objects remain private in MinIO and are streamed by the backend.
- Content types are preserved for playback.

## Reports
### POST /visits/:id/generate-report
Builds a Markdown report using accepted, non-deleted entries. Sections:
- Objective: static text.
- Observations: accepted text entries not marked as findings (bulleted; "No observations recorded." if none).
- Findings: accepted text entries marked as findings (bulleted; "No findings flagged." if none).
- Annexes: accepted photos and audios as links (or "No annexes recorded.").
Response 200:
```json
{ "report": { "visitId": "...", "content": "# Visit Report...", "generatedAt": "..." } }
```
Errors: `404` visit not found, `400` when no accepted entries (`"Cannot generate report: no accepted entries"`).

### GET /visits/:id/report
Fetch the latest report for a visit.
Response 200: `{ "report": { ... } }`
Errors: `404` when no report exists.
