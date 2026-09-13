import { prisma } from "@/lib/prisma";
import { getComplaints } from "@/services/complaint.service";
import { getSystemKPIs, getDepartmentPerformance } from "@/services/analytics.service";
import type { SessionUser } from "@/types";
import type { FilterComplaintInput } from "@/schemas/complaint.schema";
import PDFDocument from "pdfkit";

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

// ─────────────────────────────────────────────────────────────
// 1. GENERATE CSV COMPLAINTS EXPORT
// ─────────────────────────────────────────────────────────────
export async function generateComplaintsCSV(user: SessionUser, rawFilters: FilterComplaintInput): Promise<string> {
  if (!user || !user.id) throw new Error("Authentication required");

  // Force max limit 10,000 for exports
  const filters: FilterComplaintInput = {
    ...rawFilters,
    page: 1,
    pageSize: 10000,
  };

  const { data: complaints } = await getComplaints(user, filters);

  const isCitizen = user.role === "CITIZEN";

  // Build CSV Headers
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

  // Create Audit Log
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
export async function generateComplaintSummaryPDF(user: SessionUser, rawFilters: FilterComplaintInput): Promise<Buffer> {
  if (!user || !user.id) throw new Error("Authentication required");

  const kpis = await getSystemKPIs(user, { range: "30d" });

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);

        // Audit log
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

      // PDF Content
      doc.fillColor("#1E3A8A").fontSize(20).text("CivicResolve — Complaint Summary Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fillColor("#4B5563").fontSize(10).text(`Generated On: ${new Date().toLocaleString()} | Requested By: ${user.name || user.email} (${user.role})`, { align: "center" });
      doc.moveDown(1.5);

      // Section: Overview KPIs
      doc.fillColor("#111827").fontSize(14).text("Executive Summary (Last 30 Days)", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("#374151");
      doc.text(`• Total Complaints: ${kpis.totalComplaints}`);
      doc.text(`• Open Complaints: ${kpis.openComplaints}`);
      doc.text(`• Resolved Complaints: ${kpis.resolvedComplaints}`);
      doc.text(`• Resolution Rate: ${kpis.resolutionRatePercent}%`);
      doc.text(`• SLA Compliance Rate: ${kpis.slaCompliancePercent}%`);
      doc.text(`• Active SLA Breaches: ${kpis.slaBreaches}`);
      doc.text(`• Average Resolution Time: ${kpis.avgResolutionHours} hours`);

      doc.moveDown(1.5);
      doc.fillColor("#9CA3AF").fontSize(8).text("CivicResolve Automated Reporting Engine — Confidential Government Report", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 3. GENERATE DEPARTMENT PERFORMANCE PDF REPORT
// ─────────────────────────────────────────────────────────────
export async function generateDepartmentPerformancePDF(user: SessionUser): Promise<Buffer> {
  if (!user || !user.id) throw new Error("Authentication required");
  if (user.role !== "ADMIN" && user.role !== "DEPARTMENT_MANAGER") {
    throw new Error("Forbidden: Department performance PDF generation access denied.");
  }

  const perfList = user.role === "ADMIN"
    ? await getDepartmentPerformance(user, { range: "30d" })
    : [];

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

      doc.fillColor("#1E3A8A").fontSize(20).text("CivicResolve — Department Performance Report", { align: "center" });
      doc.moveDown(0.5);
      doc.fillColor("#4B5563").fontSize(10).text(`Generated On: ${new Date().toLocaleString()} | Scoped for: ${user.role}`, { align: "center" });
      doc.moveDown(1.5);

      if (user.role === "ADMIN") {
        doc.fillColor("#111827").fontSize(14).text("Department Metrics Breakdown", { underline: true });
        doc.moveDown(0.8);

        for (const dept of perfList) {
          doc.fontSize(11).fillColor("#1D4ED8").text(`${dept.departmentName} (${dept.departmentCode})`);
          doc.fontSize(9).fillColor("#374151");
          doc.text(`   Total Complaints: ${dept.totalComplaints} | Open: ${dept.openComplaints} | Resolved: ${dept.resolvedComplaints}`);
          doc.text(`   Resolution Rate: ${dept.resolutionRatePercent}% | SLA Compliance: ${dept.slaCompliancePercent}% | Breaches: ${dept.slaBreaches}`);
          doc.text(`   Avg Resolution Time: ${dept.avgResolutionHours} hrs`);
          doc.moveDown(0.5);
        }
      } else {
        doc.fillColor("#111827").fontSize(12).text(`Department Scoped Performance Report for Department ID: ${user.departmentId}`);
      }

      doc.moveDown(1.5);
      doc.fillColor("#9CA3AF").fontSize(8).text("CivicResolve Automated Reporting Engine", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
