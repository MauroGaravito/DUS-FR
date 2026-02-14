# DUS Field Report Development Notes

## Current State Summary

- Backend API contracts are stable and unchanged.
- Frontend was refactored from single-page flow to routed modular architecture.
- Documentation was renamed with unique `DUS_FR_` prefixes and centralized under `docs/`.
- Frontend production serving uses Nginx (static `dist/`) behind Caddy reverse proxy.

## Major Design Decisions

- Keep MVP domain model minimal: `User`, `Visit`, `Entry`, `Report`.
- Preserve strict API contract compatibility during frontend refactor.
- Use Markdown for deterministic report rendering portability.
- Keep AI report as schema-validated JSON output for structured UI rendering.
- Store media binaries in MinIO and metadata in MongoDB.

## Frontend Refactor Decisions

- Adopt MUI v5 for enterprise-style responsive UI.
- Adopt React Router v6 route-based navigation.
- Move networking concerns to `src/services/api.js`.
- Keep auth token flow in `localStorage` unchanged.
- Use local page/component state only, no Redux/global state library.

## Operational Notes

- Audio entries require explicit review state transitions.
- Transcription is user-triggered and asynchronous.
- Report generation requires accepted non-deleted entries.
- Backend media proxy is intentionally unauthenticated for browser playback compatibility.

## Known Limitations

- No pagination, sorting controls, or advanced filtering in lists.
- Limited role/authorization granularity beyond authenticated user access.
- No antivirus scanning or deep content inspection for uploads.
- Latest-report retrieval model favors most recent report over version history.

## Suggested Next Iterations

1. Add report versioning and report history UI.
2. Add pagination and search for visits and entries.
3. Add background queue for transcription/retry handling.
4. Harden media delivery with signed URLs or scoped tokens.
5. Add audit logs for approvals and critical state transitions.

