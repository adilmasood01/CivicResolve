import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import { createPresetSchema, type CreatePresetInput } from "@/schemas/complaint.schema";

export async function getFilterPresets(user: SessionUser) {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  // Fetch presets owned by user OR shared presets (if Admin created shared presets)
  const presets = await prisma.complaintFilterPreset.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { isShared: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return presets;
}

export async function createFilterPreset(user: SessionUser, rawInput: CreatePresetInput) {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const validated = createPresetSchema.parse(rawInput);

  // Only ADMIN can mark presets as shared
  const isShared = user.role === "ADMIN" ? validated.isShared : false;

  const preset = await prisma.$transaction(async (tx) => {
    const created = await tx.complaintFilterPreset.create({
      data: {
        name: validated.name,
        filters: validated.filters as any,
        isShared,
        ownerId: user.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "FILTER_PRESET_CREATED",
        entity: "ComplaintFilterPreset",
        entityId: created.id,
        metadata: {
          name: created.name,
          isShared: created.isShared,
        },
      },
    });

    return created;
  });

  return preset;
}

export async function deleteFilterPreset(user: SessionUser, presetId: string) {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const preset = await prisma.complaintFilterPreset.findUnique({
    where: { id: presetId },
  });

  if (!preset) {
    throw new Error("Preset not found");
  }

  // Must be owner or ADMIN
  if (preset.ownerId !== user.id && user.role !== "ADMIN") {
    throw new Error("Forbidden: You cannot delete this preset.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaintFilterPreset.delete({
      where: { id: presetId },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "FILTER_PRESET_DELETED",
        entity: "ComplaintFilterPreset",
        entityId: presetId,
        metadata: {
          name: preset.name,
        },
      },
    });
  });

  return { success: true };
}
