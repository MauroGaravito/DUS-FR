# DUS Field Report MVP

All project documentation is centralized in:

- `docs/DUS_FR_DOCS_HUB.md`

Quick start:

1. Ensure Docker is running.
2. From repo root run: `docker compose up --build`.
3. Open:
- Frontend: served via your reverse proxy (Caddy) from the `dus-fr-frontend` container on internal port `80`
- Backend API: `http://localhost:4000`
- MongoDB: `localhost:27017`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Default seeded user:

- Email: `engineer@example.com`
- Password: `password123`

