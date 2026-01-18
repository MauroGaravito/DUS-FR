# Development Notes

## Design decisions
- Kept models minimal to match MVP scope (Visit, Entry, Report, User).
- Used Markdown for report content for easy rendering and portability.
- Audio/photo uploads go through multer memory storage then to MinIO; URLs only are persisted.
- Text entries and photos auto-accept; audio starts pending to enforce review.
- Added lightweight upload guardrails (MIME + size) to avoid storing unusable media and to keep MinIO predictable for MVP use.
- Enforced explicit status transitions for audio so user approval flow stays clean; text/photo remain auto-accepted.
- Report generation requires at least one accepted, non-deleted entry to ensure output has substance.

## Known limitations
- No pagination or advanced filtering on lists.
- No role-based authorization beyond the basic user record.
- File validation is minimal but bounded to a few MIME types and size caps; no virus scanning or deep inspection.
- Reports overwrite the previous report for a visit (single latest stored).

## Intentionally left out
- AI generation, transcription, advanced roles/permissions, project hierarchy.
- Public file serving hardening (presigned URLs, ACLs) beyond simple bucket URL.
- UI polish and routing; kept to a single-page flow.

## Next phases
1. Add transcription pipeline for audio (manual or automated).
2. Introduce role-specific permissions and audit logs.
3. Paginate visits/entries and add search.
4. Harden media access (presigned URLs) and extend file validation (content sniffing, AV scanning).
5. Version reports instead of overwriting.
