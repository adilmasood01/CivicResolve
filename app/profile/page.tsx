import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth, getDashboardPath } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile",
};

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Citizen",
  OFFICER: "Staff officer",
  DEPARTMENT_MANAGER: "Department manager",
  ADMIN: "Administrator",
};

export default async function ProfilePage() {
  const sessionUser = await requireAuth("/profile");

  const record = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      department: { select: { name: true } },
    },
  });

  const displayName =
    record?.name ||
    [record?.firstName, record?.lastName].filter(Boolean).join(" ") ||
    "Account";

  const roleLabel =
    ROLE_LABELS[record?.role ?? sessionUser.role] ?? sessionUser.role;

  const fields: { label: string; value: string }[] = [
    { label: "Name", value: displayName },
    { label: "Email", value: record?.email ?? sessionUser.email },
  ];

  if (record?.phone) {
    fields.push({ label: "Phone", value: record.phone });
  }
  if (record?.department?.name) {
    fields.push({ label: "Department", value: record.department.name });
  }
  fields.push({ label: "Role", value: roleLabel });
  fields.push({ label: "Member since", value: formatDate(record?.createdAt) });
  if (record?.lastLoginAt) {
    fields.push({ label: "Last sign-in", value: formatDate(record.lastLoginAt) });
  }

  return (
    <AppShell user={sessionUser} narrow>
      <PageHeader
        title="Your profile"
        description="Account details used for CivicResolve sign-in and routing."
        actions={
          <Link
            href={getDashboardPath(sessionUser.role)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back to dashboard
          </Link>
        }
      />

      <dl className="divide-y divide-border rounded-lg border border-border bg-card">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4 sm:items-baseline"
          >
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </AppShell>
  );
}
