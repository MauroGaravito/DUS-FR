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
- `backend` is intended to be reached through Caddy; if it is published at all, it should be bound to localhost (`127.0.0.1`).
- Both `frontend` and `backend` join an external Docker network named `shared_caddy_net` so Caddy can reach them by DNS.
- `mongo` and `minio` must never be exposed to the public internet. For optional admin access, bind them to localhost (`127.0.0.1`).

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

Recommended transcription-related variables:

- `OPENAI_TRANSCRIBE_MODEL` (default `gpt-4o-mini-transcribe`)
- `OPENAI_MODEL` (fallback supported by transcription service)
- `OPENAI_TIMEOUT_MS` (default `60000`)

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

## Backend Image Requirement (Audio Robustness)

- Backend runtime expects `ffmpeg` available in container for WAV fallback transcoding during transcription retries.
- If backend Dockerfile changes are pulled, rebuild backend with no cache before deploy:

```bash
docker compose build backend --no-cache
docker compose up -d backend
```

## Security Verification (Mongo Not Exposed)

On the VPS host, confirm Docker is not publishing MongoDB to `0.0.0.0`:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep dus-fr-mongo
docker port dus-fr-mongo
```

Expected:

- `127.0.0.1:27017->27017/tcp` (localhost only), or no published port at all.

Confirm the host is only listening on localhost:

```bash
ss -lntp | grep 27017
```

Expected:

- `127.0.0.1:27017` (and no `0.0.0.0:27017` or `:::27017`).

Firewall (example using UFW):

```bash
ufw status verbose
```

Expected:

- `27017/tcp DENY IN Anywhere` (and `(v6)`).

Definitive external test (run from a different machine outside the VPS):

```bash
nc -vz <VPS_PUBLIC_IP> 27017
nmap -Pn -p 27017 <VPS_PUBLIC_IP>
```

Expected:

- `nc` fails/times out
- `nmap` shows `closed` or `filtered` (must not be `open`)

## Local Access Without Caddy (Optional)

Production compose does not publish a frontend port. If you want local access without running Caddy, temporarily add:

```yaml
services:
  frontend:
    ports:
      - "8080:80"
```

Then open `http://localhost:8080`.
