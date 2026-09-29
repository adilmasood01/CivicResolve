# CivicResolve

A public-service complaint desk: citizens file issues, departments work them against SLA, and every status change is recorded.

This is a **portfolio project**, not a government product.

![CivicResolve](./public/og-image.svg)

---

## Overview

CivicResolve is a centralized platform where citizens submit complaints about public services, and departments receive, assign, investigate, resolve, and close those cases.

It is built to show production-style full-stack work: database design, authentication, authorization, workflow, SLA monitoring, auditability, analytics, and a responsive UI.

**Public routes (no login):** `/` landing · `/about` · `/track` · `/login` · `/register`

After sign-in, each role lands on its dashboard (`/dashboard`, `/staff/dashboard`, `/manager/dashboard`, `/admin/dashboard`).

---

## Features

- **Citizen portal** — Submit, track, and follow up on complaints
- **Officer dashboard** — Assigned cases, notes, and evidence
- **Department manager dashboard** — Workload, SLA, department analytics
- **Admin panel** — `/admin/*` control center (users/roles, departments, categories, SLA, staff, analytics, audit); see [Admin Dashboard](#admin-dashboard)
- **Complaint lifecycle** — Enforced state machine (SUBMITTED → RESOLVED → CLOSED)
- **SLA monitoring** — Per-priority deadlines with ON_TRACK / DUE_SOON / BREACHED
- **Audit trail** — Significant actions recorded immutably
- **Notifications** — In-app updates per role
- **Role-based access** — Enforced server-side via `can()`
- **Public tracking** — Look up a case by complaint number without signing in

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) + Prisma adapter |
| UI | shadcn/ui + Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Utilities | date-fns, bcryptjs, clsx, tailwind-merge |

---

## Architecture

```
app/                  Next.js App Router pages and API route handlers
├── (auth)/           Login / register
├── dashboard/        Citizen home
├── complaints/       Citizen list, submit, detail
├── staff/            Officer dashboard and cases
├── manager/          Manager dashboard, cases, analytics
├── admin/            Admin center
├── track/            Public complaint lookup
├── about/            About
└── api/              Route handlers (thin — delegate to services)

components/           Shared UI (layout, complaints, analytics, public chrome)
lib/
├── auth.ts           Session helpers and role gates
├── prisma.ts         Prisma client singleton
├── utils.ts          Shared utilities (cn, complaint numbers, dates)
├── sla.ts            SLA calculation (pure functions)
└── permissions.ts    can(user, action, resource)

services/             Business logic (called by route handlers and server actions)
schemas/              Zod schemas (shared by client and server)
types/                Shared TypeScript types
prisma/
├── schema.prisma     Database schema
├── migrations/       Versioned SQL applied by `prisma migrate deploy`
└── seed.ts           Local demo data
```

### Authorization model

```typescript
// Always called server-side — never trust client-supplied role information
can(user, "complaint:view", complaint)     // → true/false
can(user, "complaint:assign", complaint)   // → true/false
canTransition(user, "IN_PROGRESS", "RESOLVED", complaint)
```

### Complaint lifecycle

```
SUBMITTED → UNDER_REVIEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
                                                   ↘ REOPENED ↗
SUBMITTED → REJECTED
```

---

## Database Schema

Key models:

| Model | Purpose |
|---|---|
| User | All users (CITIZEN, OFFICER, DEPARTMENT_MANAGER, ADMIN) |
| Department | Government departments |
| Category | Complaint categories with default department routing |
| SLARule | Configurable SLA deadlines per priority level |
| Complaint | Core complaint with full lifecycle fields |
| ComplaintStatusHistory | Immutable audit trail of every status change |
| ComplaintComment | PUBLIC_COMMENT and INTERNAL_NOTE support |
| ComplaintAttachment | File metadata (storage-provider agnostic) |
| Rating | Post-resolution citizen rating (1–5 stars) |
| Notification | In-app notifications per user |
| AuditLog | Sensitive action audit trail |

---

## Role & Permission Model

| Action | CITIZEN | OFFICER | MANAGER | ADMIN |
|---|---|---|---|---|
| Submit complaint | ✅ (own) | — | — | ✅ |
| View complaint | ✅ (own) | ✅ (assigned/dept) | ✅ (dept) | ✅ |
| Change status | — | ✅ (limited) | ✅ (dept) | ✅ |
| Assign officer | — | — | ✅ (dept) | ✅ |
| View internal notes | — | ✅ | ✅ | ✅ |
| Manage users | — | — | — | ✅ |
| View audit logs | — | — | — | ✅ |
| System analytics | — | — | dept only | ✅ |

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL (Supabase is a convenient host)

### Steps

```bash
git clone https://github.com/adilmasood01/CivicResolve.git
cd CivicResolve

npm install

cp .env.example .env
# Set DATABASE_URL, DIRECT_URL, and AUTH_SECRET
# Prisma CLI reads `.env` (not `.env.local`)

npx prisma migrate deploy
npx prisma db seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Schema changes go through Prisma Migrate (`prisma/migrations`). Do not use `prisma db push` for setup or shared environments.

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list (placeholders only).

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection (for migrations) |
| `AUTH_SECRET` | Yes | Random secret for Auth.js session signing |
| `AUTH_URL` | Yes | Canonical URL of the app |
| `CRON_SECRET` | Yes (for cron) | Shared secret for `POST /api/cron/sla` |
| `STORAGE_PROVIDER` | No | Storage backend (`local` default; only `local` implemented) |
| `ALLOW_PRODUCTION_SEED` | No | Must be `true` to allow seed when `NODE_ENV=production` |
| `SEED_*_PASSWORD` | No | Optional overrides for demo seed passwords |

Also optional: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, and future storage/`MAX_FILE_*` keys documented in `.env.example`.

---

## Demo accounts (local only)

These are **fictional seed users** for local development. They are not affiliated with any government. Do not use these passwords on a deployed instance.

`prisma/seed.ts` refuses to run when `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=true`.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@civicresolve.gov` | `Admin@123456` |
| Manager | `manager.works@civicresolve.gov` | `Manager@123456` |
| Officer | `officer.kwame@civicresolve.gov` | `Officer@123456` |
| Citizen | `citizen.alice@example.com` | `Citizen@123456` |

Other seeded users live in `prisma/seed.ts`. Override seed passwords with `SEED_ADMIN_PASSWORD`, `SEED_MANAGER_PASSWORD`, `SEED_OFFICER_PASSWORD`, and `SEED_CITIZEN_PASSWORD` if you need to.

Public tracker example: `CMP-2026-000001`.

---

## Admin Dashboard

Super-admin features live under **`/admin/*`**, gated to the `ADMIN` role. Department managers use `/manager/*`; officers use `/staff/*`.

### How to open it

1. Sign in as the seeded admin (`admin@civicresolve.gov` — password in the table above).
2. You are redirected to **`/admin/dashboard`**.
3. Use the **Admin** sub-nav (not the top header alone) for the full menu: Users, Departments, Categories, Staff, SLA, Analytics, Audit.

The top nav only shows **Overview** for admins; the rest is in `components/admin/AdminSubNav.tsx`.

### Access control

- Middleware: `/admin/*` → ADMIN only
- Layout gate: `app/admin/layout.tsx` via `requireRole("ADMIN")`
- Permissions: `lib/permissions.ts` — `user:manage`, `department:manage`, `category:manage`, `sla:manage`, `audit:view`, `analytics:view-system`

### What admins can do

| Area | Route | Capability |
|---|---|---|
| Overview | `/admin/dashboard` | System stats |
| Users / access | `/admin/users` | Change role, department, `isActive` |
| Staff | `/admin/staff` | Staff overview |
| Departments | `/admin/departments` | Create/update, assign manager |
| Categories | `/admin/categories` | Create/update routing categories |
| SLA | `/admin/sla` | Priority resolution rules |
| Analytics | `/admin/analytics/*` | System / dept / SLA / officers |
| Audit | `/admin/audit-logs` | Read audit trail |

Backend: `app/actions/admin.ts`, `app/api/admin/`, `services/admin.service.ts`, `services/user.service.ts`.

Public registration always creates **CITIZEN**; elevating someone to officer/manager/admin is done from **Users**.

### Known gaps

- No admin create/invite user flow (promote/deactivate existing users only)
- No dedicated `/admin/complaints` (admins use `/staff/complaints`)
- No system settings / feature-flag / cron control UI
- No password reset or impersonation

---

## Deploying

- Generate a unique `AUTH_SECRET` and never commit `.env` / `.env.local`.
- Set `CRON_SECRET` and schedule `POST /api/cron/sla` with `Authorization: Bearer <CRON_SECRET>` (fail-closed if unset).
- Set `STORAGE_PROVIDER` explicitly in production (`local` only for demos; S3/Supabase adapters not implemented yet).
- Do not seed a production database with the demo accounts above.
- Apply schema with `npx prisma migrate deploy` (same command for local and production).
- Route matching in middleware is not enough: API routes and server actions authorize through `lib/permissions.ts` and DB-backed `getCurrentUser()`.
- Security model details: [SECURITY.md](./SECURITY.md)

---

## Database Commands

```bash
# Apply pending migrations (local + production)
npm run db:migrate
# equivalent: npx prisma migrate deploy

# Create a new migration during development (writes SQL under prisma/migrations)
npm run db:migrate:dev -- --name <description>

# Seed demo data
npm run db:seed

# Reset DB from migrations and re-seed (local / disposable DBs only)
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

### Existing database already created with `db push`

If the database already matches `prisma/schema.prisma` but has no migration history, baseline once instead of re-running CREATE statements:

```bash
npx prisma migrate resolve --applied 20260929000000_init
```

After that, use `migrate deploy` / `migrate dev` like any other Prisma project.

---

## Testing

```bash
# Unit / security / business-rule scripts (no DB required) — 75+ assertions
npm test

# Optional PostgreSQL integration (does not wipe DB; needs seed + RUN_INTEGRATION=1)
set RUN_INTEGRATION=1
npm run test:integration

# Playwright E2E — critical role flows (needs migrate + seed; starts `npm run dev` if none is running)
npx playwright install chromium   # first time only
npm run test:e2e
```

E2E covers ~12 flows: citizen login / submit / view / comment / IDOR denial; officer login / view assigned / status change; manager login / assign officer; admin login / manage user. Uses the [demo accounts](#demo-accounts-local-only) above. Mutation tests reset seeded complaint status via Prisma so runs stay idempotent.

---

## Future extensions

The architecture can support these without a rewrite of the core workflow:

- AI-powered complaint classification
- Automatic department routing using ML
- Email / SMS notifications
- GIS / map visualization
- Mobile application
- Multilingual support

---

## License

[MIT](./LICENSE) — for portfolio and educational use.
