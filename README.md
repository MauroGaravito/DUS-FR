# DUS Field Report MVP

End-to-end field reporting MVP with React + Vite frontend, Node.js + Express backend, MongoDB for data, and MinIO for media storage. Docker Compose orchestrates all services.

## Tech stack
- Frontend: React (Vite), REST API consumption
- Backend: Node.js, Express, Mongoose, JWT auth
- Data: MongoDB
- Media: MinIO (S3-compatible)
- Containerization: Docker Compose

## Architecture overview
- Frontend talks to the backend REST API over the internal Docker network.
- Backend persists core models in MongoDB and streams media files to MinIO. Only file URLs live in Mongo.
- JWT secures all protected routes; a seeded engineer user is available for first login.
- Reports are generated server-side from accepted entries (no AI).

## Running the stack
1. Ensure Docker is running.
2. From the repo root, run:
   ```bash
   docker compose up --build
   ```
3. Services:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000
   - MongoDB: localhost:27017 (container name `mongo`)
   - MinIO: API http://localhost:9000, Console http://localhost:9001

## Environment variables
Set via `docker-compose.yml` (override as needed):
- Backend: `PORT`, `MONGO_URI`, `JWT_SECRET`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_PUBLIC_URL`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`, `SEED_USER_NAME`
- Frontend: `VITE_API_URL`

## Default seeded user
- Email: `engineer@example.com`
- Password: `password123`

Use this account to log in and start creating visits, entries, and reports.
