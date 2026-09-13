"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  createComplaint,
  updateComplaintStatus,
  addComment,
} from "@/services/complaint.service";
import { assignOfficer } from "@/services/assignment.service";
import type { ApiResponse } from "@/types";
import type { CommentType, ComplaintStatus } from "@prisma/client";
import { getErrorMessage } from "@/lib/utils";

/**
 * Server Action: Submit a new citizen complaint
 */
export async function createComplaintAction(
  rawInput: Record<string, unknown>
): Promise<ApiResponse<{ id: string; complaintNumber: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "You must be logged in to submit a complaint." };
    }

    const complaint = await createComplaint(user, rawInput as any);

    revalidatePath("/dashboard");
    revalidatePath("/complaints");

    return {
      success: true,
      data: {
        id: complaint.id,
        complaintNumber: complaint.complaintNumber,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Server Action: Update complaint status
 */
export async function updateStatusAction(
  complaintId: string,
  toStatus: ComplaintStatus,
  reason?: string
): Promise<ApiResponse<{ status: ComplaintStatus }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const updated = await updateComplaintStatus(user, complaintId, {
      toStatus,
      reason,
    });

    revalidatePath(`/complaints/${complaintId}`);
    revalidatePath(`/staff/complaints/${complaintId}`);
    revalidatePath(`/manager/complaints/${complaintId}`);
    revalidatePath("/complaints");
    revalidatePath("/staff/complaints");
    revalidatePath("/manager/complaints");

    return {
      success: true,
      data: { status: updated.status },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Server Action: Assign an officer to a complaint
 */
export async function assignOfficerAction(
  complaintId: string,
  officerId: string | null
): Promise<ApiResponse<{ assignedOfficerId: string | null }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const updated = await assignOfficer(user, complaintId, { officerId });

    revalidatePath(`/manager/complaints/${complaintId}`);
    revalidatePath(`/staff/complaints/${complaintId}`);
    revalidatePath(`/complaints/${complaintId}`);
    revalidatePath("/manager/complaints");
    revalidatePath("/staff/complaints");

    return {
      success: true,
      data: { assignedOfficerId: updated.assignedOfficerId },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Server Action: Add a comment or internal note
 */
export async function addCommentAction(
  complaintId: string,
  content: string,
  type: CommentType
): Promise<ApiResponse<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const comment = await addComment(user, complaintId, { content, type });

    revalidatePath(`/complaints/${complaintId}`);
    revalidatePath(`/staff/complaints/${complaintId}`);
    revalidatePath(`/manager/complaints/${complaintId}`);

    return {
      success: true,
      data: { id: comment.id },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}
