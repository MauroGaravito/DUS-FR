# DUS Field Report System Architecture

## Component Topology

- Browser App (React + Vite + MUI v5 + React Router v6)
- Backend API (Node.js + Express)
- MongoDB (users, visits, entries, reports)
- MinIO (binary media objects)
- OpenAI APIs (audio transcription, structured AI report generation)

## Data Boundaries

- MongoDB stores metadata and business entities.
- MinIO stores media binaries (audio/photo).
- Backend maps MinIO object references to `fileUrl`.
- Frontend consumes backend API only.

## End-to-End Flow

1. User logs in and receives JWT.
2. Frontend stores JWT in `localStorage`.
3. User creates or selects a visit.
4. User submits text, photo, or audio entries.
5. Backend validates payload and persists entry metadata.
6. Audio entries remain `pending` until accepted or rejected.
7. Optional transcription is requested per audio entry.
8. Reports are generated from accepted, non-deleted entries.
9. AI reports are generated from text and audio transcription context; images are surfaced as annexes.

## Entry Lifecycle

`created/uploaded` -> `pending` (audio only) -> `accepted` or `rejected`

Constraints:

- Text and photo entries are auto-accepted.
- `deleted` is soft-delete and excluded from listing/report generation.
- Only accepted entries are considered report inputs.

## Reporting Modes

- Standard report: deterministic Markdown assembly by backend.
- AI report: JSON output validated against schema, then rendered in frontend editor/workspace.
- AI report scope currently excludes image visual analysis to avoid policy/refusal instability.
- Latest report retrieval: one endpoint returns most recent stored report per visit.

## Security Model

- JWT protects all core endpoints except:
- `/auth/login`
- `/health`
- `/media/:objectName`

Media design:

- MinIO objects stay private.
- Browser playback uses backend media proxy for streaming.

## Deployment Architecture

Docker Compose services:

- `frontend` served by Nginx on internal `:80` (typically behind Caddy reverse proxy)
- `backend` on internal `:4000` (publish only to localhost if needed)
- `mongo` on internal `:27017` (never publish publicly)
- `minio` on internal `:9000` (never publish publicly)
- MinIO Console on internal `:9001` (never publish publicly)

Internal service DNS (inside compose) uses compose names (`backend`, `mongo`, `minio`).

Production routing (recommended):

- Caddy is the public entrypoint.
- `/api/*` is reverse-proxied to `dus-fr-backend:4000` with `/api` stripped.
- All other paths are reverse-proxied to `dus-fr-frontend:80` (SPA).

Networking:

- `shared_caddy_net` is an external network shared across stacks so Caddy can reach app containers by DNS alias.

