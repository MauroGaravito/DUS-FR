# DUS Field Report API Contract

## Base URLs

Direct (local / internal):

- `http://localhost:4000`

Behind Caddy (recommended production pattern):

- Use `/api` as the public API prefix.
- Example: `https://field-report.downundersolutions.com/api`

Note:

- When proxied through Caddy, requests are expected to hit `/api/*` and Caddy strips the `/api` prefix before forwarding to the backend.

Authentication:

- Send `Authorization: Bearer <JWT>` on all protected endpoints.
- Public endpoints: `/auth/login`, `/health`, `/media/:objectName`.

## Health

### GET /health

Response `200`:

```json
{ "status": "ok" }
```

## Auth

### POST /auth/login

Request:

```json
{ "email": "engineer@example.com", "password": "password123" }
```

Response `200`:

```json
{ "token": "jwt", "user": { "id": "...", "name": "...", "email": "...", "role": "engineer" } }
```

Errors: `400` missing fields, `401` invalid credentials.

## Users

### GET /users/me

Response `200`:

```json
{ "user": { "id": "...", "name": "...", "email": "...", "role": "engineer" } }
```

Errors: `401` missing or invalid token.

## Visits

### POST /visits

Create visit.

```json
{ "projectName": "Bridge A", "location": "Site 3", "status": "draft" }
```

Notes:

- `status` is optional and defaults to `draft`.
- PATCH validation accepts only `draft` and `final`.

Response `201`: `{ "visit": { ... } }`
Errors: `400` missing fields.

### GET /visits

List visits. Response `200`: `{ "visits": [ ... ] }`

### GET /visits/:id

Fetch visit. Response `200`: `{ "visit": { ... } }`
Errors: `404` visit not found.

### PATCH /visits/:id

Update fields: `projectName`, `location`, `status`.
Response `200`: `{ "visit": { ... } }`
Errors: `404` not found, `400` invalid status.

## Entries

### POST /visits/:id/entries

Entry creation modes:

- `type`: `"text" | "audio" | "photo"`.
- Text: JSON body `{ "type": "text", "text": "details", "isFinding": true }`.
- Audio or photo: `multipart/form-data` with `type`, `file`, optional `isFinding`.

Entry lifecycle:

- Audio starts as `pending`.
- Text and photo default to `accepted`.

Validation:

- Text minimum length: 5 chars.
- Audio MIME: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/webm`.
- Audio max size: 10 MB.
- Photo MIME: `image/jpeg`, `image/png`.
- Photo max size: 5 MB.

Response `201`: `{ "entry": { ... } }`
Errors: `400` invalid payload, `404` visit not found, `500` media upload failure.

### GET /visits/:id/entries

List non-deleted entries. Response `200`: `{ "entries": [ ... ] }`

### PATCH /entries/:id

Update fields: `status`, `text`, `transcription`, `isFinding`, `edited`, `deleted`.
Response `200`: `{ "entry": { ... } }`

Guardrails:

- Only audio entries may be `pending`.
- Cannot reject an already accepted audio entry.
- Cannot accept an already rejected audio entry.
- Updated text must still be at least 5 characters.

Errors: `400` invalid transition/content, `404` entry not found.

### POST /entries/:id/transcribe

Trigger audio transcription.

- Applies only to audio entries.
- Allowed only if `transcriptionStatus` is `idle` or `error`.
- Blocked if status is `processing` or `done`.
- Success writes `transcription`, `transcriptionStatus=done`, `transcribedAt`.
- Failure writes `transcriptionStatus=error`, `transcriptionError`.

Response `200`: `{ "entry": { ... } }`
Errors: `400`, `404`, `500`.

## Media Proxy

### GET /media/:objectName

- Streams private MinIO objects through backend.
- No JWT required for browser media playback.
- Returns source content-type for native players.

Errors: `404` object missing, `500` stream error.

## Reports

### POST /visits/:id/generate-report

Generates deterministic Markdown report from accepted, non-deleted entries.

Response `200`:

```json
{ "report": { "visitId": "...", "content": "# Visit Report...", "generatedAt": "..." } }
```

Errors: `404` visit not found, `400` no accepted entries.

### POST /visits/:id/generate-ai-report

Generates AI JSON report from accepted, non-deleted entries.

- Industry prompt selected from backend prompt files.
- If omitted, industry defaults to forestry.

Request (optional):

```json
{ "industry": "forestry" }
```

Response `200`:

```json
{ "report": { "visitId": "...", "type": "ai", "content": "{...}", "model": "...", "promptVersion": "...", "generatedAt": "..." } }
```

Errors: `404` visit not found, `400` no accepted entries, `500` AI generation failure.

### GET /visits/:id/report

Returns latest report for visit.
Response `200`: `{ "report": { ... } }`
Errors: `404` no report exists.

