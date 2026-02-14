# DUS Field Report Deployment Guide

This document describes the intended production deployment topology:

- Frontend is built with Vite and served as static files by Nginx (internal port `80`).
- Caddy is the only public entrypoint and reverse-proxies:
  - `/api/*` to the backend (`dus-fr-backend:4000`) with `/api` stripped
  - everything else to the frontend (`dus-fr-frontend:80`)

## Docker Compose Expectations

In `docker-compose.yml`:

- `frontend` is built using `frontend/Dockerfile.prod` (multi-stage build; runtime image is Nginx).
- `frontend` does not publish ports to the host.
- `backend` publishes `4000` for local development only.
- Both `frontend` and `backend` join an external Docker network named `shared_caddy_net` so Caddy can reach them by DNS.

## Required Environment Variables

Frontend build-time:

- `VITE_API_URL` (recommended default): `/api`
  - The frontend code builds requests like `${VITE_API_URL}/visits`, `${VITE_API_URL}/auth/login`, etc.
  - With `/api`, browser calls become `/api/visits`, `/api/auth/login`.

Backend runtime (high-level):

- `MONGO_URI`
- `JWT_SECRET`
- `MINIO_*`
- `OPENAI_*`

## Caddy Configuration (Recommended)

Example site block:

```caddy
field-report.downundersolutions.com {
    encode gzip

    @api path /api/*
    handle @api {
        uri strip_prefix /api
        reverse_proxy dus-fr-backend:4000
    }

    # Optional: keep these working at the root path if needed
    handle /media/* {
        reverse_proxy dus-fr-backend:4000
    }

    handle /health {
        reverse_proxy dus-fr-backend:4000
    }

    handle {
        reverse_proxy dus-fr-frontend:80
    }
}
```

Important notes:

- Do not proxy `/visits/*` at the root. Those are SPA routes; they must go to the frontend so Nginx can serve `index.html`.
- If you proxy `/visits/*` to the backend, deep links and refresh will break (backend will return 404 or JSON).

## Dockploy Notes

- Ensure Caddy and this stack are attached to the same external network: `shared_caddy_net`.
- Ensure service discovery uses the configured aliases:
  - `dus-fr-frontend` for the frontend
  - `dus-fr-backend` for the backend

## Local Access Without Caddy (Optional)

Production compose does not publish a frontend port. If you want local access without running Caddy, temporarily add:

```yaml
services:
  frontend:
    ports:
      - "8080:80"
```

Then open `http://localhost:8080`.

