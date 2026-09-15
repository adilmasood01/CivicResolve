import AuthNav from "@/components/AuthNav";
import { PageContainer } from "@/components/layout/PageContainer";
import type { SessionUser } from "@/types";
import type { ReactNode } from "react";

interface AppShellProps {
  user: SessionUser;
  children: ReactNode;
  unreadCount?: number;
  narrow?: boolean;
  className?: string;
}

/** Authenticated page chrome: AuthNav + consistent content width. */
export function AppShell({
  user,
  children,
  unreadCount,
  narrow,
  className,
}: AppShellProps) {
  return (
    <div className="dashboard-layout">
      <AuthNav user={user} unreadCount={unreadCount} />
      <main className="dashboard-main">
        <PageContainer narrow={narrow} className={className}>
          {children}
        </PageContainer>
      </main>
    </div>
  );
}
