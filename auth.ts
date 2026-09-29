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
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),

  // JWT strategy — required for Credentials provider and Edge middleware
  session: {
    strategy: "jwt",
    // Shorter lifetime reduces stale JWT privilege window at the middleware layer.
    // getCurrentUser() revalidates role/isActive against the DB for Node requests.
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 30 * 60, // refresh session cookie every 30 minutes of activity
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
});

