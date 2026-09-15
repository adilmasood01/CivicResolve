import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import { AdminSubNav } from "@/components/admin/AdminSubNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("ADMIN");

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />
      <AdminSubNav />
      <main className="min-h-[calc(100vh-7rem)] pb-12 pt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
