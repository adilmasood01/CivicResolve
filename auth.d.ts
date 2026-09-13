/**
 * CivicResolve — Auth.js v5 Type Augmentation
 *
 * Extends next-auth's default Session and JWT types to include
 * CivicResolve-specific fields: role and departmentId.
 *
 * Without this file, TypeScript would not know about these custom fields
 * and would produce errors when accessing session.user.role etc.
 */

import type { Role } from "@prisma/client";
import type { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      departmentId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    departmentId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
    departmentId: string | null;
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      role: Role;
      departmentId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    departmentId: string | null;
  }
}

