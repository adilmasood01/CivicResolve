/**
 * CivicResolve — Phase 7 security & reliability regression tests
 */

import { authorizeCronRequest, safeEqualSecret } from "@/lib/cron-auth";
import {
  sanitizeFileName,
  validateAttachmentFile,
  filterAttachmentsVisibleToRole,
} from "@/lib/attachments";
import { LocalStorageProvider } from "@/lib/storage";
import {
  getClientSafeErrorMessage,
  getClientErrorStatus,
} from "@/lib/utils";
import { can } from "@/lib/permissions";
import { AttachmentVisibility, ComplaintStatus, Role } from "@prisma/client";
import path from "path";
import os from "os";
import fs from "fs/promises";

async function run() {
  console.log("==================================================");
  console.log("  CIVICRESOLVE PHASE 7 SECURITY REGRESSION TESTS  ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}${detail ? ` (${detail})` : ""}`);
      failed++;
    }
  }

  // ── Cron fail-closed ────────────────────────────────────────
  const prevCron = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;

  const unconfigured = authorizeCronRequest(
    new Request("http://localhost/api/cron/sla", { method: "POST" })
  );
  assert(
    !unconfigured.ok && unconfigured.status === 503,
    "1. Missing CRON_SECRET → deny (503 fail-closed)"
  );

  process.env.CRON_SECRET = "test-cron-secret-value-32chars!!";
  const noAuth = authorizeCronRequest(
    new Request("http://localhost/api/cron/sla", { method: "POST" })
  );
  assert(!noAuth.ok && noAuth.status === 401, "2. No cron auth header → 401");

  const wrong = authorizeCronRequest(
    new Request("http://localhost/api/cron/sla", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    })
  );
  assert(!wrong.ok && wrong.status === 401, "3. Wrong cron secret → 401");

  const okBearer = authorizeCronRequest(
    new Request("http://localhost/api/cron/sla", {
      method: "POST",
      headers: { authorization: "Bearer test-cron-secret-value-32chars!!" },
    })
  );
  assert(okBearer.ok, "4. Correct Bearer cron secret → allowed");

  const okHeader = authorizeCronRequest(
    new Request("http://localhost/api/cron/sla", {
      method: "POST",
      headers: { "x-cron-secret": "test-cron-secret-value-32chars!!" },
    })
  );
  assert(okHeader.ok, "5. Correct x-cron-secret → allowed");

  assert(
    safeEqualSecret("abc", "abc") && !safeEqualSecret("abc", "abd"),
    "6. timing-safe secret compare works"
  );

  if (prevCron === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = prevCron;

  // ── Filename / path traversal sanitization ──────────────────
  assert(
    sanitizeFileName("../../secret.txt") === "secret.txt",
    "7. Filename ../../secret.txt stripped to basename"
  );
  assert(
    sanitizeFileName("..\\..\\secret.txt") === "secret.txt",
    "8. Filename ..\\..\\secret.txt stripped"
  );
  assert(
    !sanitizeFileName("%2e%2e/passwd").includes("/") &&
      !sanitizeFileName("%2e%2e/passwd").includes(".."),
    "9. Encoded traversal characters neutralized"
  );

  // ── Magic-byte MIME spoofing ────────────────────────────────
  const fakeJpeg = Buffer.from("not-a-real-jpeg-file");
  const spoof = validateAttachmentFile(fakeJpeg, "photo.jpg", "image/jpeg");
  assert(!spoof.isValid, "10. JPEG MIME with wrong magic bytes rejected");

  const pngMagic = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
  ]);
  const pngOk = validateAttachmentFile(pngMagic, "a.png", "image/png");
  assert(pngOk.isValid, "11. Valid PNG magic bytes accepted");

  const pdfMagic = Buffer.from("%PDF-1.4 rest-of-header");
  const pdfAsPng = validateAttachmentFile(pdfMagic, "x.png", "image/png");
  assert(!pdfAsPng.isValid, "12. PDF bytes with PNG MIME rejected");

  const jpegMagic = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const jpgNormalized = validateAttachmentFile(jpegMagic, "photo.jpg", "image/jpg");
  assert(jpgNormalized.isValid, "12b. image/jpg normalized to image/jpeg and accepted");

  // ── Storage key independence + traversal on read ────────────
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "civic-storage-"));
  const storage = new LocalStorageProvider(tmp);
  const uploaded = await storage.uploadFile(
    pngMagic,
    "../../evil.png",
    "image/png"
  );
  assert(
    !uploaded.storageKey.includes("..") &&
      !uploaded.storageKey.includes("/") &&
      !uploaded.storageKey.includes("\\"),
    "13. Storage key never controlled by user path"
  );
  let traversalDenied = false;
  try {
    await storage.getFileBuffer("../secret.txt");
  } catch {
    traversalDenied = true;
  }
  assert(traversalDenied, "14. Storage getFileBuffer rejects path traversal keys");
  await fs.rm(tmp, { recursive: true, force: true });

  // ── Attachment visibility (IDOR-related DTO) ────────────────
  const mixed = [
    { id: "p", visibility: AttachmentVisibility.PUBLIC, fileName: "a.jpg" },
    { id: "i", visibility: AttachmentVisibility.INTERNAL, fileName: "b.pdf" },
  ];
  assert(
    filterAttachmentsVisibleToRole(mixed, Role.CITIZEN).every(
      (a) => a.visibility === AttachmentVisibility.PUBLIC
    ),
    "15. Citizen never sees INTERNAL attachment metadata"
  );

  // ── Notification / complaint IDOR permission matrix ─────────
  const complaintA = {
    citizenId: "cit-a",
    departmentId: "dept-1",
    assignedOfficerId: "off-1",
    status: ComplaintStatus.IN_PROGRESS,
  };
  assert(
    !can(
      { id: "cit-b", role: Role.CITIZEN, departmentId: null },
      "complaint:view",
      complaintA
    ),
    "16. Citizen B cannot view Citizen A complaint"
  );
  assert(
    !can(
      { id: "off-2", role: Role.OFFICER, departmentId: "dept-2" },
      "complaint:view",
      complaintA
    ),
    "17. Officer other-dept unassigned cannot view complaint"
  );
  assert(
    !can(
      { id: "mgr-2", role: Role.DEPARTMENT_MANAGER, departmentId: "dept-2" },
      "complaint:view",
      complaintA
    ),
    "18. Manager other-dept cannot view complaint"
  );

  // ── Client-safe errors ──────────────────────────────────────
  assert(
    getClientSafeErrorMessage(new Error("Forbidden: no access")).includes(
      "Forbidden"
    ),
    "19. Business Forbidden message preserved for clients"
  );
  assert(
    getClientSafeErrorMessage(
      new Error("Invalid `prisma.user.findMany()` invocation in /app/foo.ts")
    ) === "An unexpected error occurred",
    "20. Prisma error details suppressed for clients"
  );
  assert(
    getClientErrorStatus(new Error("Forbidden: x")) === 403,
    "21. Forbidden maps to HTTP 403"
  );

  // ── CSV formula injection (export) ──────────────────────────
  const { sanitizeCSVCell } = await import("@/services/export.service");
  assert(
    sanitizeCSVCell("=CMD()") === "\"'=CMD()\"",
    "22. CSV formula injection (=) neutralized"
  );

  console.log("\n==================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log("==================================================\n");
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
