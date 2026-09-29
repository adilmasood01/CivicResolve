/**
 * Seed demo accounts — passwords match prisma/seed.ts defaults / SEED_*_PASSWORD overrides.
 */

export type SeedRole = "citizen" | "citizenB" | "officer" | "manager" | "admin";

export const SEED_USERS = {
  citizen: {
    email: "citizen.alice@example.com",
    password: process.env.SEED_CITIZEN_PASSWORD || "Citizen@123456",
    dashboardPath: "/dashboard",
  },
  citizenB: {
    email: "citizen.bob@example.com",
    password: process.env.SEED_CITIZEN_PASSWORD || "Citizen@123456",
    dashboardPath: "/dashboard",
  },
  officer: {
    email: "officer.kwame@civicresolve.gov",
    password: process.env.SEED_OFFICER_PASSWORD || "Officer@123456",
    dashboardPath: "/staff/dashboard",
  },
  manager: {
    email: "manager.works@civicresolve.gov",
    password: process.env.SEED_MANAGER_PASSWORD || "Manager@123456",
    dashboardPath: "/manager/dashboard",
  },
  admin: {
    email: "admin@civicresolve.gov",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@123456",
    dashboardPath: "/admin/dashboard",
  },
} as const satisfies Record<
  SeedRole,
  { email: string; password: string; dashboardPath: string }
>;

/** Seeded complaint numbers used by E2E assertions (see prisma/seed.ts). */
export const SEED_COMPLAINTS = {
  /** Alice · IN_PROGRESS · assigned to Kwame · Public Works */
  aliceAssigned: "CMP-2026-000001",
  /** Bob · ASSIGNED · Municipal · used for IDOR check */
  bobOwned: "CMP-2026-000002",
  /** Public Works · UNDER_REVIEW · unassigned — manager assign target */
  managerAssignable: "CMP-2026-000017",
} as const;
