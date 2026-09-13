# CivicResolve

> A Government/Public-Service Complaint Management System — portfolio-grade full-stack application.

![CivicResolve](./public/og-image.png)

---

## Overview

CivicResolve is a centralized platform where citizens can submit complaints about public services and government departments can receive, assign, investigate, resolve, and close those complaints.

Built to demonstrate production-quality full-stack engineering: database design, authentication, authorization, workflow management, SLA monitoring, auditability, analytics, and responsive UI.

---

## Features

- **Citizen Portal** — Submit, track, and follow up on complaints
- **Officer Dashboard** — Manage assigned complaints, add notes, upload evidence
- **Department Manager Dashboard** — Monitor team workload, SLA compliance, analytics
- **Admin Panel** — Full system control: users, departments, categories, SLA rules, audit logs
- **Complaint Lifecycle** — Enforced state machine (SUBMITTED → RESOLVED → CLOSED)
- **SLA Monitoring** — Per-priority deadlines with visual ON_TRACK / DUE_SOON / BREACHED indicators
- **Audit Trail** — Every significant action recorded immutably
- **Notifications** — In-app notification system per user role
- **Role-based Access Control** — Enforced server-side via centralized `can()` permission function
- **Public Complaint Tracking** — Track by complaint number without login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Auth.js v5 (NextAuth) + Prisma adapter |
| UI Components | shadcn/ui + Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Data Fetching | TanStack Query |
| Charts | Recharts |
| Utilities | date-fns, bcryptjs, clsx, tailwind-merge |

---

## Architecture

```
app/                  Next.js App Router pages and API route handlers
├── (auth)/           Login / register flows
├── (citizen)/        Citizen dashboard and complaint pages
├── (staff)/          Officer views
├── (manager)/        Department manager views
├── (admin)/          Admin panels
└── api/              REST-style route handlers (thin — delegate to services)

lib/
├── prisma.ts         Prisma client singleton
├── utils.ts          Shared utilities (cn, generateComplaintNumber, etc.)
├── sla.ts            SLA calculation and status logic (pure functions)
└── permissions.ts    Central can(user, action, resource) permission system

services/             Business logic layer (called by route handlers)
repositories/         Database access layer (called by services)
schemas/              Zod validation schemas (shared between client and server)
types/                Shared TypeScript types and interfaces
prisma/
├── schema.prisma     Database schema
└── seed.ts           Demo data seeder
```

### Authorization Model

```typescript
// Always called server-side — never trust client-supplied role information
can(user, "complaint:view", complaint)     // → true/false
can(user, "complaint:assign", complaint)   // → true/false
canTransition(user, "IN_PROGRESS", "RESOLVED", complaint)
```

### Complaint Lifecycle

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

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd civicresolve

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET

# 4. Push database schema
npx prisma db push

# 5. Seed demo data
npx prisma db seed

# 6. Start development server
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

## Demo Accounts [Local Development Only]

> ⚠️ **SECURITY NOTICE**: The demo accounts listed below are intended strictly for local development and testing environments.
> Do NOT seed demo accounts or expose these passwords in production deployments.

| Role | Email | Default Password (Dev Only) |
|---|---|---|
| Admin | admin@civicresolve.gov | Admin@123456 |
| Manager (Public Works) | manager.works@civicresolve.gov | Manager@123456 |
| Manager (Water) | manager.water@civicresolve.gov | Manager@123456 |
| Manager (Traffic) | manager.traffic@civicresolve.gov | Manager@123456 |
| Officer | officer.kwame@civicresolve.gov | Officer@123456 |
| Officer | officer.fatima@civicresolve.gov | Officer@123456 |
| Officer | officer.samuel@civicresolve.gov | Officer@123456 |
| Officer | officer.grace@civicresolve.gov | Officer@123456 |
| Citizen | citizen.alice@example.com | Citizen@123456 |
| Citizen | citizen.bob@example.com | Citizen@123456 |

---

## Production Security & Deployment Guidelines

1. **Seed Execution Guard**: The database seed script (`prisma/seed.ts`) automatically blocks execution when `NODE_ENV=production`. Seeding demo accounts in production is prohibited by default.
2. **Environment Variable Passwords**: If initial administrative users are seeded during initial setup, seed passwords must be set via secure environment variables (`SEED_ADMIN_PASSWORD`, `SEED_MANAGER_PASSWORD`, `SEED_OFFICER_PASSWORD`, `SEED_CITIZEN_PASSWORD`) rather than hardcoded fallbacks.
3. **Independent Authorization Enforcement**: All API routes and Server Actions independently perform role and resource-level authorization (`lib/permissions.ts`), ensuring zero reliance on middleware route matching alone.
4. **Secret Management**: Ensure `AUTH_SECRET`, `DATABASE_URL`, and database credentials are fully generated and managed via secure secret store in production environments.

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

## Future Extensions

The architecture is designed to support these without major refactoring:

- AI-powered complaint classification
- Automatic department routing using ML
- Email / SMS notifications
- GIS / map visualization
- Mobile application
- Multilingual support

---

## License

MIT — for portfolio and educational use.
