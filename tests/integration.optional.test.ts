/**
 * Optional real-DB integration checks.
 * Skips unless RUN_INTEGRATION=1 and DATABASE_URL is set.
 *
 * Does not wipe the database. Creates a disposable citizen + complaint when run,
 * then best-effort cleans up.
 */

import { prisma } from "@/lib/prisma";
import { createComplaint, getComplaintById } from "@/services/complaint.service";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { SessionUser } from "@/types";

async function main() {
  if (process.env.RUN_INTEGRATION !== "1") {
    console.log("SKIP: set RUN_INTEGRATION=1 to run database integration tests");
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL required for integration tests");
    process.exit(1);
  }

  console.log("Running optional integration tests against PostgreSQL…");

  const category = await prisma.category.findFirst({
    where: { isActive: true, departmentId: { not: null } },
  });
  if (!category) {
    console.error("FAIL: no active category with department — seed the database first");
    process.exit(1);
  }

  const email = `integration.${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      name: "Integration Citizen",
      passwordHash: await bcrypt.hash("Citizen@123456", 12),
      role: Role.CITIZEN,
      isActive: true,
    },
  });

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: Role.CITIZEN,
    departmentId: null,
    image: null,
  };

  const other: SessionUser = {
    id: "non-existent-other-user",
    email: "other@example.com",
    name: "Other",
    role: Role.CITIZEN,
    departmentId: null,
    image: null,
  };

  try {
    const complaint = await createComplaint(session, {
      title: "Integration pothole report",
      description: "Automated integration test complaint body text.",
      categoryId: category.id,
      location: "Test Street",
    });

    if (!complaint.complaintNumber.startsWith("CMP-")) {
      throw new Error("complaint number format unexpected");
    }

    const own = await getComplaintById(session, complaint.id);
    if (!own) throw new Error("owner cannot load own complaint");

    const leaked = await getComplaintById(other, complaint.id);
    if (leaked) throw new Error("IDOR: other citizen loaded complaint");

    console.log("✅ PASS: create + owner read + IDOR deny");
  } finally {
    await prisma.complaint.deleteMany({ where: { citizenId: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
