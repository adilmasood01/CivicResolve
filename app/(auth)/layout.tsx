/**
 * CivicResolve — Auth Layout
 * Wraps /login and /register with a centered, branded layout.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <div className="auth-container">{children}</div>
    </div>
  );
}
