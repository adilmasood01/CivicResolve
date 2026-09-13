/**
 * CivicResolve — Auth.js v5 Configuration
 *
 * Single source of truth for authentication.
 * Exports: auth, handlers, signIn, signOut
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // JWT strategy — required for Credentials provider and Edge middleware
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            departmentId: true,
            passwordHash: true,
            isActive: true,
          },
        });

        if (!user || !user.passwordHash || !user.isActive) {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordValid) {
          return null;
        }

        // Update lastLoginAt (fire-and-forget — don't block auth)
        prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => {}); // Silently ignore errors

        // Return session-safe user (no passwordHash)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          departmentId: user.departmentId,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * Embed custom claims into the JWT token.
     * Called after authorize() succeeds and on every token refresh.
     */
    async jwt({ token, user }) {
      if (user) {
        // First sign-in — populate token from the authorize() return value
        // user may be AdapterUser | User depending on provider
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

  // Trustworthy host configuration
  trustHost: true,
});
