import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    /**
     * Embed custom claims into the JWT token.
     * Called after authorize() succeeds and on every token refresh.
     */
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: Role;
          departmentId?: string | null;
        };
        token.id = u.id ?? token.sub ?? "";
        token.role = u.role ?? "CITIZEN";
        token.departmentId = u.departmentId ?? null;
      }
      return token;
    },

    /**
     * Surface custom claims onto the session object.
     * This is what server components / API routes receive.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: Role }).role = token.role as Role;
        (session.user as { departmentId?: string | null }).departmentId =
          (token.departmentId ?? null) as string | null;
      }
      return session;
    },
  },
  providers: [], // Configured with full providers in auth.ts
  trustHost: true,
} satisfies NextAuthConfig;
