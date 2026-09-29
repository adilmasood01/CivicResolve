# CivicResolve Security Model

This document summarizes the security posture of CivicResolve for portfolio and operational review.
It does **not** authorize production government use.

## Authentication

- Auth.js / NextAuth v5 with Credentials provider
- Passwords hashed with bcrypt (cost factor 12)
- JWT sessions (8 hour maxAge; cookie refresh every 30 minutes of activity)
- Inactive users (`isActive=false`) are rejected at login
- Server-side `getCurrentUser()` re-reads `role`, `departmentId`, and `isActive` from PostgreSQL on each Node request so role demotions and deactivations take effect for APIs and Server Actions even if a JWT cookie remains

## Authorization

- Central permission engine: `lib/permissions.ts` (`can`, `canTransition`)
- Middleware (`middleware.ts` + `lib/route-access.ts`) provides coarse route gates; **services remain authoritative**
- Role scopes:
  - **CITIZEN** — own complaints only
  - **OFFICER** — assigned complaints (mutations) / same-department view
  - **DEPARTMENT_MANAGER** — own department
  - **ADMIN** — system-wide (with self-demotion / self-deactivate protections)

## IDOR protections

- Complaint detail returns `null` / HTTP 404 on unauthorized access (no existence oracle via 403)
- Notifications are always filtered by `userId` from the session (never from client-supplied owner IDs)
- Filter presets are owner-scoped (shared presets admin-only)
- Attachment download/delete re-check complaint visibility and INTERNAL/PUBLIC rules

## Attachments

- Allowlisted MIME types: JPEG, PNG, WEBP, PDF
- Magic-byte verification must match declared MIME
- Filenames sanitized; storage keys are UUID-based (never user path segments)
- Local storage rejects `..` traversal on read/delete
- Citizens never receive INTERNAL attachment metadata on complaint detail or list APIs
- Downloads use `Content-Disposition: attachment` and `no-store`

## SLA cron

- `POST /api/cron/sla` requires `CRON_SECRET`
- **Fail-closed**: if `CRON_SECRET` is unset, the endpoint returns 503
- Accepts `Authorization: Bearer <secret>` or `x-cron-secret`
- Comparison uses constant-time equality
- Never logs the secret value

## Reports / exports

- CSV/PDF generation runs through authenticated, role-scoped services
- CSV cells are sanitized against formula injection (`=`, `+`, `-`, `@`, …)
- Export volume capped (paged collection, max 2000 rows)
- Export actions write audit log entries

## Audit logging

- Sensitive admin and workflow actions write `AuditLog` rows
- Audit log HTTP API is read-only (mutating methods return 405)

## Security headers

Configured in `next.config.ts`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Content-Security-Policy` (App Router compatible; `'unsafe-eval'` and `ws:`/`wss:` only in development for React DevTools / HMR — not in production)
- `Strict-Transport-Security` in production

## Responsible disclosure

If you discover a vulnerability in this portfolio project:

1. Do not exploit it beyond a minimal proof of concept
2. Report privately to the repository owner
3. Allow reasonable time for remediation before public discussion

## Out of scope / remaining risks

See the latest Phase 7 report for items still marked REMAINING (for example cloud object storage adapters, full Playwright E2E in CI, and dependency transitive advisories).
