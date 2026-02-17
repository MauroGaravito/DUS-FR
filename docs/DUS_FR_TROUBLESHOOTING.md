# DUS Field Report Troubleshooting

This document lists common production issues and the fastest checks to confirm root cause.

## 502 Bad Gateway (Caddy)

Symptom:

- Browser shows `502 Bad Gateway`.

Most common causes:

1. Caddy upstream points to the old Vite port (`:5173`).
2. Caddy is not attached to `shared_caddy_net` and cannot resolve `dus-fr-frontend` / `dus-fr-backend`.

Checks:

- Confirm Caddy site uses `reverse_proxy dus-fr-frontend:80`.
- Confirm Caddy container is connected to `shared_caddy_net`.

## SPA Deep Links Return 404 or JSON

Symptom:

- Refreshing `/visits/<id>` returns backend JSON or 404.

Cause:

- Caddy is proxying `/visits*` (or other SPA routes) to the backend.

Fix:

- Only proxy the API under `/api/*` (and optionally `/media/*`, `/health`).
- Everything else must go to the frontend.

## `GET /api/visits/:id/report` Returns 404

Symptom:

- Frontend requests `GET /api/visits/<id>/report` and receives `404` with an Express response.

Cause:

- The backend route exists, but returns `404` when no report record exists yet for that visit and type.

Notes:

- Default type is deterministic when `?type=` is not provided.
- Generate a report first:
  - `POST /api/visits/:id/generate-report` for deterministic
  - `POST /api/visits/:id/generate-ai-report` then `GET /api/visits/:id/report?type=ai` for AI

## Mobile Photo Upload Does Not Offer Camera

Symptom:

- On mobile, selecting a photo only shows "Choose file" but not "Camera".

What controls this:

- The file input should use `accept="image/*"`.
- For camera capture, a dedicated input can use `capture="environment"`.

Implementation reference:

- `frontend/src/components/entries/EntryForm.jsx`

## Audio Transcription Fails For `.m4a` / Mobile Audio

Symptom:

- `POST /entries/:id/transcribe` returns `500`.
- Logs include:
  - `Audio file might be corrupted or unsupported`
  - `Invalid file format...`

Current behavior:

- Backend retries transcription with alternative MIME/model combinations.
- If needed, backend transcodes audio to WAV (requires `ffmpeg` in backend container).

Checks:

- Rebuild backend image after Dockerfile changes (`ffmpeg` install):
  - `docker compose build backend --no-cache`
  - `docker compose up -d backend`
- Confirm backend logs show fallback attempt lines when needed.

## AI Report Generation Returns 500 With Empty Response

Symptom:

- `POST /visits/:id/generate-ai-report` returns `500`.
- Logs include `OpenAI returned empty response`.

Most common causes:

1. Model refusal payload instead of content JSON (for example image-person analysis refusal).
2. Upstream transient response missing `message.content`.

Current mitigation:

- AI report flow no longer sends image attachments for visual analysis.
- Prompt explicitly instructs analysis based on text and audio transcriptions only.

Checks:

- Inspect backend logs for `OpenAI report empty/unexpected response payload`.
- Verify the request still has accepted text/audio entries with useful content.

## MongoDB Exposure (Critical)

Symptom:

- Unexpected databases/collections appear (for example: `READ__ME_TO_RECOVER_YOUR_DATA`).
- Users/visits/entries disappear, or the app starts returning 401/404 unexpectedly.

Most common cause:

- MongoDB was published publicly (`0.0.0.0:27017->27017`) and scanned by bots.

Fast checks (VPS host):

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep mongo
ss -lntp | grep 27017
ufw status verbose
```

Expected safe posture:

- Mongo published only to `127.0.0.1:27017` or not published at all.
- UFW denies `27017/tcp` (IPv4 and IPv6).
