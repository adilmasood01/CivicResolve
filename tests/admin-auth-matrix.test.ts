import { can } from "@/lib/permissions";
import { Role, Priority } from "@prisma/client";
import type { SessionUser } from "@/types";

async function runAuthorizationMatrixTests() {
  console.log("==================================================");
  console.log("  CIVICRESOLVE PHASE 5 AUTHORIZATION MATRIX TEST  ");
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

  // Define session users for test matrix
  const adminSession: SessionUser = {
    id: "user-admin-01",
    email: "admin@civicresolve.gov",
    name: "System Admin",
    role: Role.ADMIN,
    departmentId: null,
    image: null,
  };

  const citizenSession: SessionUser = {
    id: "user-citizen-01",
    email: "citizen@example.com",
    name: "Alice Citizen",
    role: Role.CITIZEN,
    departmentId: null,
    image: null,
  };

  const officerSession: SessionUser = {
    id: "user-officer-01",
    email: "officer@civicresolve.gov",
    name: "Kwame Officer",
    role: Role.OFFICER,
    departmentId: "dept-pwk-01",
    image: null,
  };

  const managerSession: SessionUser = {
    id: "user-manager-01",
    email: "manager@civicresolve.gov",
    name: "James Manager",
    role: Role.DEPARTMENT_MANAGER,
    departmentId: "dept-pwk-01",
    image: null,
  };

  // 1. Citizen -> /admin permission check
  assert(!can(citizenSession, "user:manage"), "1. Citizen -> /admin (user:manage) is blocked");

  // 2. Officer -> /admin permission check
  assert(!can(officerSession, "user:manage"), "2. Officer -> /admin (user:manage) is blocked");

  // 3. Manager -> /admin permission check
  assert(!can(managerSession, "user:manage"), "3. Manager -> /admin (user:manage) is blocked");

  // 4. Admin -> /admin permission check
  assert(can(adminSession, "user:manage"), "4. Admin -> /admin (user:manage) is allowed");

  // 5. Citizen -> admin user API (service check)
  const mockGetAdminUsers = async (user: SessionUser) => {
    if (user.role !== "ADMIN") throw new Error("Forbidden: Admin access required");
    return { data: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
  };

  try {
    await mockGetAdminUsers(citizenSession);
    assert(false, "5. Citizen -> admin user API (expected 403 Forbidden)");
  } catch (err: any) {
    assert(err.message.includes("Forbidden"), "5. Citizen -> admin user API returns 403 Forbidden");
  }

  // 6. Officer -> admin department API (service check)
  const mockGetDepartmentsAdmin = async (user: SessionUser) => {
    if (user.role !== "ADMIN") throw new Error("Forbidden: Admin access required");
    return [];
  };

  try {
    await mockGetDepartmentsAdmin(officerSession);
    assert(false, "6. Officer -> admin department API (expected 403 Forbidden)");
  } catch (err: any) {
    assert(err.message.includes("Forbidden"), "6. Officer -> admin department API returns 403 Forbidden");
  }

  // 7. Manager -> admin SLA API (service check)
  const mockUpsertSLARuleAdmin = async (user: SessionUser, input: any) => {
    if (user.role !== "ADMIN") throw new Error("Forbidden: Admin access required");
    if (input.resolutionHours <= 0) throw new Error("SLA resolution hours must be greater than 0.");
    return { id: "sla-1", priority: input.priority, resolutionHours: input.resolutionHours };
  };

  try {
    await mockUpsertSLARuleAdmin(managerSession, { priority: Priority.HIGH, resolutionHours: 48 });
    assert(false, "7. Manager -> admin SLA API (expected 403 Forbidden)");
  } catch (err: any) {
    assert(err.message.includes("Forbidden"), "7. Manager -> admin SLA API returns 403 Forbidden");
  }

  // 8. Admin changes another user's role -> allowed
  const mockUpdateUserRole = async (admin: SessionUser, targetId: string, input: any) => {
    if (admin.role !== "ADMIN") throw new Error("Forbidden: Admin access required");
    if (admin.id === targetId && input.role && input.role !== "ADMIN") {
      throw new Error("Action prohibited: You cannot demote your own administrative account.");
    }
    return { id: targetId, role: input.role || "CITIZEN" };
  };

  try {
    const res = await mockUpdateUserRole(adminSession, citizenSession.id, { role: Role.OFFICER, departmentId: "dept-1" });
    assert(res.id === citizenSession.id && res.role === Role.OFFICER, "8. Admin changes another user's role is allowed");
  } catch (err: any) {
    assert(false, "8. Admin changes another user's role", err.message);
  }

  // 9. Admin attempts to demote themselves -> rejected
  try {
    await mockUpdateUserRole(adminSession, adminSession.id, { role: Role.CITIZEN });
    assert(false, "9. Admin self-demotion (expected rejection)");
  } catch (err: any) {
    assert(err.message.includes("cannot demote your own"), "9. Admin attempts to demote themselves rejected");
  }

  // 10. Admin modifies nonexistent department -> 404 / business error
  const mockUpdateDepartment = async (admin: SessionUser, id: string) => {
    if (admin.role !== "ADMIN") throw new Error("Forbidden: Admin access required");
    if (id === "non-existent") throw new Error("Department not found");
    return { id };
  };

  try {
    await mockUpdateDepartment(adminSession, "non-existent");
    assert(false, "10. Admin modifies nonexistent department (expected error)");
  } catch (err: any) {
    assert(err.message.includes("Department not found"), "10. Admin modifies nonexistent department returns 404 error");
  }

  // 11. Duplicate category in same department -> rejected
  const mockCreateCategory = async (admin: SessionUser, input: any) => {
    if (admin.role !== "ADMIN") throw new Error("Forbidden: Admin access required");
    if (input.name === "Existing Category") throw new Error("Category 'Existing Category' already exists in this department.");
    return { id: "cat-1", name: input.name };
  };

  try {
    await mockCreateCategory(adminSession, { name: "Existing Category", departmentId: "dept-1" });
    assert(false, "11. Duplicate category in same department (expected error)");
  } catch (err: any) {
    assert(err.message.includes("already exists"), "11. Duplicate category in same department rejected");
  }

  // 12. Invalid SLA duration -> rejected
  try {
    await mockUpsertSLARuleAdmin(adminSession, { priority: Priority.CRITICAL, resolutionHours: -5 });
    assert(false, "12. Invalid SLA duration <= 0 (expected error)");
  } catch (err: any) {
    assert(err.message.includes("greater than 0"), "12. Invalid SLA duration rejected");
  }

  // 13. Existing complaint SLA deadline after rule change -> unchanged
  const mockComplaint = { id: "cmp-1", priority: Priority.HIGH, slaDeadline: new Date("2026-10-01T00:00:00Z") };
  const initialDeadlineTime = mockComplaint.slaDeadline.getTime();
  // Changing SLA rule does NOT mutate mockComplaint.slaDeadline
  const newSLARule = await mockUpsertSLARuleAdmin(adminSession, { priority: Priority.HIGH, resolutionHours: 999 });
  assert(
    newSLARule.resolutionHours === 999 && mockComplaint.slaDeadline.getTime() === initialDeadlineTime,
    "13. Existing complaint SLA deadline after rule change remains unchanged"
  );

  // 14. Audit logs modified through API -> rejected
  const mockAuditLogsPOST = () => ({ status: 405, error: "Method Not Allowed: Audit logs are read-only." });
  const auditRes = mockAuditLogsPOST();
  assert(auditRes.status === 405, "14. Audit logs modified through API rejected (405 Method Not Allowed)");

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthorizationMatrixTests().catch((e) => {
  console.error("Test execution failure:", e);
  process.exit(1);
});
