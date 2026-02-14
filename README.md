# DUS Field Report MVP

All project documentation is centralized in:

- `docs/DUS_FR_DOCS_HUB.md`

## Local Quick Start

1. Ensure Docker is running.
2. From repo root run: `docker compose up --build`.
3. Open:
- Backend API: `http://localhost:4000`
- MongoDB: `localhost:27017`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Frontend (production build):

- The `frontend` container serves static files via Nginx on internal port `80` and is intended to be reached through Caddy.
- For local access without Caddy, you can temporarily add a port mapping to the `frontend` service: `8080:80`, then open `http://localhost:8080`.

Security note:

- Do not publish MongoDB (`27017`) to the public internet. Bind to localhost or do not publish the port at all.

Default seeded user:

- Email: `engineer@example.com`
- Password: `password123`

