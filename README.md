# DUS Field Report MVP

This is the project root. All detailed documentation is centralized in `docs/INDEX.md`.

Key docs:
- `docs/INDEX.md` – docs hub and links
- `docs/API.md` – API reference
- `docs/ARCHITECTURE.md` – system and data flows
- `docs/DEV_NOTES.md` – design decisions and limitations
- `docs/BACKEND.md` – backend routes, models, services

Run the stack:
1) Ensure Docker is running.
2) From repo root: `docker compose up --build`.
3) Services: frontend http://localhost:5173, backend http://localhost:4000, MongoDB localhost:27017, MinIO http://localhost:9000 (console http://localhost:9001).

Default seeded user: `engineer@example.com` / `password123`.
