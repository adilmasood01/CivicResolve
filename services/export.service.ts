import { prisma } from "@/lib/prisma";
import { getComplaints } from "@/services/complaint.service";
import {
  getSystemKPIs,
  getDepartmentPerformance,
  getDepartmentAnalytics,
} from "@/services/analytics.service";
import type { SessionUser } from "@/types";
import type { FilterComplaintInput } from "@/schemas/complaint.schema";
import PDFDocument from "pdfkit";

export const EXPORT_MAX_RECORDS = 2000;
const EXPORT_PAGE_SIZE = 100;

// ─────────────────────────────────────────────────────────────
// CSV FORMULA INJECTION SANITIZER
// ─────────────────────────────────────────────────────────────
export function sanitizeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).replace(/"/g, '""');

  // Prevent CSV formula injection by prepending single quote if starting with dangerous chars
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str}"`;
}

/**
 * Collect role-scoped complaints for export without exceeding schema pageSize max.
 */
async function collectComplaintsForExport(
  user: SessionUser,
  rawFilters: FilterComplaintInput
) {
  const complaints: Awaited<ReturnType<typeof getComplaints>>["data"] = [];
  let page = 1;

  while (complaints.length < EXPORT_MAX_RECORDS) {
    const { data, meta } = await getComplaints(user, {
      ...rawFilters,
      page,
      pageSize: EXPORT_PAGE_SIZE,
    });
    complaints.push(...data);
    if (!meta.hasNextPage || data.length === 0) break;
    page += 1;
  }

  return complaints.slice(0, EXPORT_MAX_RECORDS);
}

// ─────────────────────────────────────────────────────────────
// 1. GENERATE CSV COMPLAINTS EXPORT
// ─────────────────────────────────────────────────────────────
export async function generateComplaintsCSV(
  user: SessionUser,
  rawFilters: FilterComplaintInput
): Promise<string> {
  if (!user || !user.id) throw new Error("Authentication required");

  const complaints = await collectComplaintsForExport(user, rawFilters);
  const isCitizen = user.role === "CITIZEN";

  const headers = isCitizen
    ? ["Complaint #", "Title", "Category", "Status", "Priority", "Location", "Date Created", "Resolved Date"]
    : [
        "Complaint #",
        "Title",
        "Category",
        "Department",
        "Status",
        "Priority",
        "Citizen",
        "Assigned Officer",
        "SLA Deadline",
        "SLA Status",
        "Date Created",
        "Resolved Date",
      ];

  const rows: string[] = [headers.map(sanitizeCSVCell).join(",")];

  for (const c of complaints) {
    if (isCitizen) {
      const row = [
        c.complaintNumber,
        c.title,
        c.category?.name || "",
        c.status,
        c.priority,
        c.location || "",
        c.createdAt ? new Date(c.createdAt).toISOString() : "",
        c.resolvedAt ? new Date(c.resolvedAt).toISOString() : "",
      ];
      rows.push(row.map(sanitizeCSVCell).join(","));
    } else {
      const row = [
        c.complaintNumber,
        c.title,
        c.category?.name || "",
        c.department?.name || "",
        c.status,
        c.priority,
        c.citizen?.name || c.citizen?.email || "",
        c.assignedOfficer?.name || c.assignedOfficer?.email || "Unassigned",
        c.slaDeadline ? new Date(c.slaDeadline).toISOString() : "",
        c.slaInfo?.status || "",
        c.createdAt ? new Date(c.createdAt).toISOString() : "",
        c.resolvedAt ? new Date(c.resolvedAt).toISOString() : "",
      ];
      rows.push(row.map(sanitizeCSVCell).join(","));
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CSV_EXPORTED",
      entity: "Complaint",
      metadata: {
        recordCount: complaints.length,
        filters: rawFilters,
      },
    },
  });

  return rows.join("\n");
}

// ─────────────────────────────────────────────────────────────
// 2. GENERATE COMPLAINT SUMMARY PDF REPORT
// ─────────────────────────────────────────────────────────────
export async function generateComplaintSummaryPDF(
  user: SessionUser,
  rawFilters: FilterComplaintInput
): Promise<Buffer> {
  if (!user || !user.id) throw new Error("Authentication required");

  // Citizens/officers: scoped complaint summary (no system analytics permission required)
  // Managers/admins: KPI summary via analytics service
  let summaryLines: string[] = [];

  if (user.role === "ADMIN" || user.role === "DEPARTMENT_MANAGER") {
    const kpis = await getSystemKPIs(user, { range: "30d" });
    summaryLines = [
      `Total Complaints: ${kpis.totalComplaints}`,
      `Open Complaints: ${kpis.openComplaints}`,
      `Resolved Complaints: ${kpis.resolvedComplaints}`,
      `Resolution Rate: ${kpis.resolutionRatePercent}%`,
      `SLA Compliance Rate: ${kpis.slaCompliancePercent}%`,
      `Active SLA Breaches: ${kpis.slaBreaches}`,
      `Average Resolution Time: ${kpis.avgResolutionHours} hours`,
    ];
  } else {
    const complaints = await collectComplaintsForExport(user, {
      ...rawFilters,
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
    });
    const open = complaints.filter(
      (c) => !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status)
    ).length;
    const resolved = complaints.filter((c) =>
      ["RESOLVED", "CLOSED"].includes(c.status)
    ).length;
    summaryLines = [
      `Complaints in export scope: ${complaints.length}`,
      `Open (in sample): ${open}`,
      `Resolved/Closed (in sample): ${resolved}`,
      `Note: Summary is scoped to your authorized complaints (max ${EXPORT_MAX_RECORDS}).`,
    ];
  }

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "PDF_REPORT_GENERATED",
            entity: "Complaint",
            metadata: { reportType: "COMPLAINT_SUMMARY" },
          },
        });

        resolve(pdfData);
      });

      doc
        .fillColor("#1E3A8A")
        .fontSize(20)
        .text("CivicResolve — Complaint Summary Report", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fillColor("#4B5563")
        .fontSize(10)
        .text(
          `Generated On: ${new Date().toLocaleString()} | Requested By: ${user.name || user.email} (${user.role})`,
          { align: "center" }
        );
      doc.moveDown(1.5);

      doc.fillColor("#111827").fontSize(14).text("Summary", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#374151");
      for (const line of summaryLines) {
        doc.text(`• ${line}`);
      }

      doc.moveDown(1.5);
      doc
        .fillColor("#9CA3AF")
        .fontSize(8)
        .text("CivicResolve Automated Reporting Engine", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 3. GENERATE DEPARTMENT PERFORMANCE PDF REPORT
// ─────────────────────────────────────────────────────────────
export async function generateDepartmentPerformancePDF(
  user: SessionUser
): Promise<Buffer> {
  if (!user || !user.id) throw new Error("Authentication required");
  if (user.role !== "ADMIN" && user.role !== "DEPARTMENT_MANAGER") {
    throw new Error("Forbidden: Department performance PDF generation access denied.");
  }

  const perfList: Array<{
    departmentName: string;
    departmentCode: string;
    totalComplaints: number;
    openComplaints: number;
    resolvedComplaints: number;
    resolutionRatePercent: number;
    slaCompliancePercent: number;
    slaBreaches: number;
    avgResolutionHours: number;
  }> = [];

  if (user.role === "ADMIN") {
    const rows = await getDepartmentPerformance(user, { range: "30d" });
    perfList.push(...rows);
  } else {
    if (!user.departmentId) {
      throw new Error("Forbidden: Department manager has no assigned department.");
    }
    const analytics = await getDepartmentAnalytics(user, user.departmentId, {
      range: "30d",
    });
    perfList.push({
      departmentName: analytics.department.name,
      departmentCode: analytics.department.code,
      totalComplaints: analytics.kpis.totalComplaints,
      openComplaints: analytics.kpis.openComplaints,
      resolvedComplaints: analytics.kpis.resolvedComplaints,
      resolutionRatePercent: analytics.kpis.resolutionRatePercent,
      slaCompliancePercent: analytics.kpis.slaCompliancePercent,
      slaBreaches: analytics.kpis.slaBreaches,
      avgResolutionHours: analytics.kpis.avgResolutionHours,
    });
  }

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);

        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "PDF_REPORT_GENERATED",
            entity: "Department",
            metadata: { reportType: "DEPARTMENT_PERFORMANCE" },
          },
        });

        resolve(pdfData);
      });

      doc
        .fillColor("#1E3A8A")
        .fontSize(20)
        .text("CivicResolve — Department Performance Report", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fillColor("#4B5563")
        .fontSize(10)
        .text(
          `Generated On: ${new Date().toLocaleString()} | Scoped for: ${user.role}`,
          { align: "center" }
        );
      doc.moveDown(1.5);

      doc.fillColor("#111827").fontSize(14).text("Department Metrics", { underline: true });
      doc.moveDown(0.8);

      if (perfList.length === 0) {
        doc
          .fontSize(10)
          .fillColor("#374151")
          .text("No department metrics available for your scope.");
      }

      for (const dept of perfList) {
        doc
          .fontSize(11)
          .fillColor("#1D4ED8")
          .text(`${dept.departmentName} (${dept.departmentCode})`);
        doc.fontSize(9).fillColor("#374151");
        doc.text(
          `   Total Complaints: ${dept.totalComplaints} | Open: ${dept.openComplaints} | Resolved: ${dept.resolvedComplaints}`
        );
        doc.text(
          `   Resolution Rate: ${dept.resolutionRatePercent}% | SLA Compliance: ${dept.slaCompliancePercent}% | Breaches: ${dept.slaBreaches}`
        );
        doc.text(`   Avg Resolution Time: ${dept.avgResolutionHours} hrs`);
        doc.moveDown(0.5);
      }

      doc.moveDown(1.5);
      doc
        .fillColor("#9CA3AF")
        .fontSize(8)
        .text("CivicResolve Automated Reporting Engine", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
