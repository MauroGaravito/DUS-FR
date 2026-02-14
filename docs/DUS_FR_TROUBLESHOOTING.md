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

