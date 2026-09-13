import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { getStorageProvider } from "@/lib/storage";
import { validateAttachmentFile, sanitizeFileName } from "@/lib/attachments";
import { SAFE_USER_SELECT } from "@/services/complaint.service";
import type { SessionUser } from "@/types";
import { AttachmentVisibility } from "@prisma/client";

export async function uploadComplaintAttachment(
  user: SessionUser,
  complaintId: string,
  fileBuffer: Buffer,
  rawFileName: string,
  declaredMimeType: string,
  visibility: AttachmentVisibility = AttachmentVisibility.PUBLIC
) {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  // 1. Fetch complaint
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // 2. Authorization check: Must be able to view complaint
  const authorized = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    "complaint:view",
    {
      citizenId: complaint.citizenId,
      departmentId: complaint.departmentId,
      assignedOfficerId: complaint.assignedOfficerId,
      status: complaint.status,
    }
  );

  if (!authorized) {
    throw new Error("Forbidden: You do not have permission to attach files to this complaint.");
  }

  // 3. Citizen can only upload PUBLIC evidence to their own complaint
  if (user.role === "CITIZEN") {
    if (complaint.citizenId !== user.id) {
      throw new Error("Forbidden: Citizens can only upload attachments to their own complaints.");
    }
    if (visibility === AttachmentVisibility.INTERNAL) {
      throw new Error("Forbidden: Citizens cannot create internal staff evidence.");
    }
  }

  // 4. Validate file size, MIME type, and magic bytes
  const sanitizedName = sanitizeFileName(rawFileName);
  const validation = validateAttachmentFile(fileBuffer, sanitizedName, declaredMimeType);
  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid attachment file");
  }

  // 5. Store file using storage provider
  const storageProvider = getStorageProvider();
  const uploadResult = await storageProvider.uploadFile(
    fileBuffer,
    sanitizedName,
    validation.detectedMimeType || declaredMimeType
  );

  // 6. DB Transaction: Create attachment record & Audit log
  const attachment = await prisma.$transaction(async (tx) => {
    const record = await tx.complaintAttachment.create({
      data: {
        complaintId,
        uploadedById: user.id,
        fileName: sanitizedName,
        fileType: validation.detectedMimeType || declaredMimeType,
        fileSize: fileBuffer.length,
        storagePath: uploadResult.storageKey,
        visibility,
      },
      include: {
        uploadedBy: { select: SAFE_USER_SELECT },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "ATTACHMENT_UPLOADED",
        entity: "ComplaintAttachment",
        entityId: record.id,
        metadata: {
          complaintId,
          fileName: sanitizedName,
          fileSize: fileBuffer.length,
          visibility,
        },
      },
    });

    return record;
  });

  return attachment;
}

export async function getComplaintAttachments(
  user: SessionUser,
  complaintId: string
) {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  const authorized = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    "complaint:view",
    {
      citizenId: complaint.citizenId,
      departmentId: complaint.departmentId,
      assignedOfficerId: complaint.assignedOfficerId,
      status: complaint.status,
    }
  );

  if (!authorized) {
    throw new Error("Forbidden: You cannot access attachments for this complaint.");
  }

  // Filter out internal attachments for Citizens
  const isCitizen = user.role === "CITIZEN";
  const whereCondition: any = { complaintId };

  if (isCitizen) {
    whereCondition.visibility = AttachmentVisibility.PUBLIC;
  }

  const attachments = await prisma.complaintAttachment.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: SAFE_USER_SELECT },
    },
  });

  return attachments;
}

export async function getAttachmentForDownload(
  user: SessionUser,
  attachmentId: string
) {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const attachment = await prisma.complaintAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      complaint: true,
    },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  const { complaint } = attachment;

  // Authorization check
  const authorized = can(
    { id: user.id, role: user.role, departmentId: user.departmentId },
    "complaint:view",
    {
      citizenId: complaint.citizenId,
      departmentId: complaint.departmentId,
      assignedOfficerId: complaint.assignedOfficerId,
      status: complaint.status,
    }
  );

  if (!authorized) {
    throw new Error("Forbidden: You are not authorized to download this attachment.");
  }

  // Internal visibility restriction
  if (user.role === "CITIZEN" && attachment.visibility === AttachmentVisibility.INTERNAL) {
    throw new Error("Forbidden: Internal staff attachments cannot be accessed by citizens.");
  }

  const storageProvider = getStorageProvider();
  const fileBuffer = await storageProvider.getFileBuffer(attachment.storagePath);

  return {
    attachment,
    fileBuffer,
  };
}

export async function deleteComplaintAttachment(
  user: SessionUser,
  attachmentId: string
) {
  if (!user || !user.id) {
    throw new Error("Authentication required");
  }

  const attachment = await prisma.complaintAttachment.findUnique({
    where: { id: attachmentId },
    include: { complaint: true },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  const { complaint } = attachment;

  // Can delete if Admin, or uploader, or Manager of the department
  const isUploader = attachment.uploadedById === user.id;
  const isAdmin = user.role === "ADMIN";
  const isDeptManager =
    user.role === "DEPARTMENT_MANAGER" && user.departmentId === complaint.departmentId;

  if (!isUploader && !isAdmin && !isDeptManager) {
    throw new Error("Forbidden: You do not have permission to delete this attachment.");
  }

  // Transaction: Delete record, storage file, write audit log
  await prisma.$transaction(async (tx) => {
    await tx.complaintAttachment.delete({
      where: { id: attachmentId },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "ATTACHMENT_DELETED",
        entity: "ComplaintAttachment",
        entityId: attachmentId,
        metadata: {
          complaintId: complaint.id,
          fileName: attachment.fileName,
        },
      },
    });
  });

  const storageProvider = getStorageProvider();
  await storageProvider.deleteFile(attachment.storagePath);

  return { success: true };
}
