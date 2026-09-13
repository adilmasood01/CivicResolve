import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import type { FilterAuditLogInput } from "@/schemas/admin.schema";

/**
 * Retrieves paginated audit logs for administrative inspection.
 * READ-ONLY service — no edit or delete functionality exists.
 */
export async function getAuditLogs(
  currentUser: SessionUser,
  filters: FilterAuditLogInput
) {
  if (currentUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }

  const { search, actorId, entity, action, dateFrom, dateTo, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entity: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { actor: { name: { contains: search, mode: "insensitive" } } },
      { actor: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (actorId) {
    where.actorId = actorId;
  }

  if (entity) {
    where.entity = entity;
  }

  if (action) {
    where.action = action;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
