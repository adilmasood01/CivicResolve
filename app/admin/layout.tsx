import { requireRole } from "@/lib/auth";
import AuthNav from "@/components/AuthNav";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderOpen,
  UserCheck,
  Timer,
  ScrollText,
  BarChart3,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("ADMIN");

  const navItems = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/departments", label: "Departments", icon: Building2 },
    { href: "/admin/categories", label: "Categories", icon: FolderOpen },
    { href: "/admin/staff", label: "Staff Roster", icon: UserCheck },
    { href: "/admin/sla", label: "SLA Rules", icon: Timer },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  ];

  return (
    <div className="dashboard-layout">
      <AuthNav user={user} />
      
      {/* Admin Sub-navigation Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/50 mr-2 hidden sm:inline-block">
                Admin Center
              </span>
              <nav className="flex items-center space-x-1 sm:space-x-2">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4 text-blue-400" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <main className="dashboard-main bg-slate-50 min-h-[calc(100vh-120px)] pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
