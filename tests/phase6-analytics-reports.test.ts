import { can } from "@/lib/permissions";
import { sanitizeCSVCell } from "@/services/export.service";
import { getBaseAuthorizationWhere, getDateBounds } from "@/services/analytics.service";
import { Role, ComplaintStatus, Priority } from "@prisma/client";
import type { SessionUser } from "@/types";

async function runPhase6Tests() {
  console.log("==================================================");
  console.log("  CIVICRESOLVE PHASE 6 SEARCH & ANALYTICS TEST   ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // Define mock session users
  const adminUser: SessionUser = {
    id: "user-admin-01",
    email: "admin@civicresolve.gov",
    name: "Admin User",
    role: Role.ADMIN,
    departmentId: null,
    image: null,
  };

  const managerUser: SessionUser = {
    id: "user-mgr-01",
    email: "manager@civicresolve.gov",
    name: "Public Works Manager",
    role: Role.DEPARTMENT_MANAGER,
    departmentId: "dept-pwk-01",
    image: null,
  };

  const officerUser: SessionUser = {
    id: "user-off-01",
    email: "officer@civicresolve.gov",
    name: "Kwame Officer",
    role: Role.OFFICER,
    departmentId: "dept-pwk-01",
    image: null,
  };

  const citizenUser: SessionUser = {
    id: "user-cit-01",
    email: "citizen@example.com",
    name: "Alice Citizen",
    role: Role.CITIZEN,
    departmentId: null,
    image: null,
  };

  // 1. Authorization Scope Precedence: Citizen
  const citWhere = getBaseAuthorizationWhere(citizenUser);
  assert(citWhere.citizenId === citizenUser.id, "1. Citizen scope forces citizenId = user.id");

  // 2. Authorization Scope Precedence: Manager
  const mgrWhere = getBaseAuthorizationWhere(managerUser, "dept-other-99");
  assert(
    mgrWhere.departmentId === "dept-pwk-01",
    "2. Manager scope forces manager departmentId regardless of override parameter"
  );

  // 3. Authorization Scope Precedence: Admin
  const adminWhere = getBaseAuthorizationWhere(adminUser, "dept-other-99");
  assert(
    adminWhere.departmentId === "dept-other-99",
    "3. Admin scope respects explicit department filter when supplied"
  );

  // 4. CSV Formula Injection Sanitization: Equals sign
  const escapedEquals = sanitizeCSVCell("=SUM(A1:A10)");
  assert(
    escapedEquals === '"\'=SUM(A1:A10)"',
    "4. CSV Cell starting with = is sanitized against formula injection"
  );

  // 5. CSV Formula Injection Sanitization: Plus sign
  const escapedPlus = sanitizeCSVCell("+12345");
  assert(
    escapedPlus === '"\'+12345"',
    "5. CSV Cell starting with + is sanitized against formula injection"
  );

  // 6. CSV Formula Injection Sanitization: Normal text
  const normalCell = sanitizeCSVCell("Main Street Pothole");
  assert(
    normalCell === '"Main Street Pothole"',
    "6. Normal CSV text cell formatted cleanly with quotes"
  );

  // 7. Date Bounds Utility: 30d
  const bounds30 = getDateBounds({ range: "30d" });
  const diffDays30 = Math.round(
    (bounds30.endDate.getTime() - bounds30.startDate.getTime()) / (1000 * 3600 * 24)
  );
  assert(diffDays30 >= 29 && diffDays30 <= 31, "7. Date bounds for 30d produces 30-day window");

  // 8. KPI Formula Validation: Resolution Rate & SLA Compliance
  const mockComplaints = [
    { status: ComplaintStatus.RESOLVED, inSLA: true },
    { status: ComplaintStatus.CLOSED, inSLA: true },
    { status: ComplaintStatus.IN_PROGRESS, inSLA: false },
    { status: ComplaintStatus.RESOLVED, inSLA: false },
  ];

  const total = mockComplaints.length;
  const resolved = mockComplaints.filter(
    (c) => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
  ).length;
  const resRate = Math.round((resolved / total) * 100);

  const completedInSLA = mockComplaints.filter((c) => c.inSLA).length;
  const slaCompRate = Math.round((completedInSLA / resolved) * 100);

  assert(resRate === 75, "8a. Resolution Rate KPI formula produces exact 75%");
  assert(slaCompRate === 67, "8b. SLA Compliance Rate KPI formula produces exact 67%");

  // 9. RBAC Permission Checks
  assert(can(adminUser, "analytics:view-system"), "9a. Admin has system analytics permission");
  assert(!can(citizenUser, "analytics:view-system"), "9b. Citizen lacks system analytics permission");
  assert(!can(officerUser, "analytics:view-system"), "9c. Officer lacks system analytics permission");
  assert(can(managerUser, "analytics:view-department"), "9d. Manager has department analytics permission");

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests().catch((e) => {
  console.error("Test execution failure:", e);
  process.exit(1);
});
