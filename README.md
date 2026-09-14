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
- **Admin panel** — Users, departments, categories, SLA rules, audit logs
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

cp .env.example .env.local
# Set DATABASE_URL, DIRECT_URL, and AUTH_SECRET

npx prisma db push
npx prisma db seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

See [`.env.example`](./.env.example) for the full list.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) |
| `AUTH_SECRET` | Random secret for Auth.js session signing |
| `AUTH_URL` | Canonical URL of the app |

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

## Deploying

- Generate a unique `AUTH_SECRET` and never commit `.env.local`.
- Do not seed a production database with the demo accounts above.
- Route matching in middleware is not enough: API routes and server actions still authorize through `lib/permissions.ts`.

---

## Database Commands

```bash
# Push schema changes (dev — no migration files)
npx prisma db push

# Create a migration (production)
npx prisma migrate dev --name <description>

# Reset and re-seed (local dev)
npm run db:reset

# Open Prisma Studio
npx prisma studio
```

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
