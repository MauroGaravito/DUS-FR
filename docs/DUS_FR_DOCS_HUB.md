# DUS Field Report Documentation Hub

This is the single entry point for project documentation.

## Naming Convention

All central docs use the `DUS_FR_` prefix and unique names to avoid ambiguity across repos.

## Start Here

- If you are deploying: `docs/DUS_FR_DEPLOYMENT_GUIDE.md`
- If you are integrating an API client: `docs/DUS_FR_API_CONTRACT.md`
- If you are debugging prod issues: `docs/DUS_FR_TROUBLESHOOTING.md`

## Central Documents (Source Of Truth)

- `docs/DUS_FR_API_CONTRACT.md` - endpoint contracts, request/response formats, validation rules.
- `docs/DUS_FR_SYSTEM_ARCHITECTURE.md` - system components, data flow, lifecycle.
- `docs/DUS_FR_BACKEND_REFERENCE.md` - backend folders, models, route coverage.
- `docs/DUS_FR_FRONTEND_REFERENCE.md` - frontend structure, routing, UI modules, UX behavior.
- `docs/DUS_FR_DEVELOPMENT_NOTES.md` - design decisions, known limitations, next phases.
- `docs/DUS_FR_FORESTRY_REPORT_TEMPLATE.md` - forestry AI report markdown template reference.
- `docs/DUS_FR_DEPLOYMENT_GUIDE.md` - Docker Compose + Dockploy + Caddy deployment notes (frontend served by Nginx).
- `docs/DUS_FR_TROUBLESHOOTING.md` - known issues and how to verify/fix them quickly.

## Runtime Stack

- Frontend: React + Vite + Material UI v5 + React Router v6
- Backend: Node.js + Express + Mongoose + JWT
- Data: MongoDB
- Media: MinIO (S3-compatible object storage)
- AI: OpenAI for audio transcription and structured AI report generation
- Orchestration: Docker Compose

## Local Quick Start (Docker)

1. Ensure Docker is running.
2. Run `docker compose up --build` from repo root.
3. Access services:
- Frontend: served by Nginx on internal `:80` and intended to be accessed through Caddy (see deployment guide)
- Backend: `http://localhost:4000`
- MongoDB: `localhost:27017`
- MinIO: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Non-Central Markdown Files

These markdown files are intentionally kept outside `docs/` because they are runtime assets or AI prompt sources:

- `backend/src/ai/prompts/construction.v1.md`
- `backend/src/ai/prompts/forestry.v1.md`
- `frontend/src/templates/forestryReportTemplate.md`

