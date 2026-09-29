/**
 * Lightweight Prisma helpers for E2E setup — look up seeded IDs and reset mutation targets.
 * Requires DATABASE_URL (same as the running app).
 */

import { PrismaClient, type ComplaintStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function getComplaintIdByNumber(
  complaintNumber: string
): Promise<string> {
  const complaint = await prisma.complaint.findUnique({
    where: { complaintNumber },
    select: { id: true },
  });
  if (!complaint) {
    throw new Error(
      `Seed complaint ${complaintNumber} not found. Run: npx prisma db seed`
    );
  }
  return complaint.id;
}

export async function resetComplaintStatus(
  complaintNumber: string,
  status: ComplaintStatus,
  assignedOfficerEmail?: string | null
): Promise<string> {
  const complaint = await prisma.complaint.findUnique({
    where: { complaintNumber },
    select: { id: true },
  });
  if (!complaint) {
    throw new Error(`Seed complaint ${complaintNumber} not found.`);
  }

  let assignedOfficerId: string | null | undefined = undefined;
  if (assignedOfficerEmail === null) {
    assignedOfficerId = null;
  } else if (typeof assignedOfficerEmail === "string") {
    const officer = await prisma.user.findUnique({
      where: { email: assignedOfficerEmail },
      select: { id: true },
    });
    if (!officer) {
      throw new Error(`Officer ${assignedOfficerEmail} not found.`);
    }
    assignedOfficerId = officer.id;
  }

  await prisma.complaint.update({
    where: { id: complaint.id },
    data: {
      status,
      ...(assignedOfficerId !== undefined ? { assignedOfficerId } : {}),
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
      closedAt: status === "CLOSED" ? new Date() : null,
    },
  });

  return complaint.id;
}

export async function getOfficerIdByEmail(email: string): Promise<string> {
  const officer = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!officer) {
    throw new Error(`User ${email} not found. Run: npx prisma db seed`);
  }
  return officer.id;
}

export async function disposeDb(): Promise<void> {
  await prisma.$disconnect();
}
