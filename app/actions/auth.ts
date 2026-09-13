/**
 * CivicResolve — Auth Server Actions
 *
 * Server actions for registration, login, and logout.
 * These run exclusively on the server — passwords are never exposed to the client.
 */

"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// VALIDATION SCHEMAS
// ─────────────────────────────────────────────────────────────

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─────────────────────────────────────────────────────────────
// ACTION RESULT TYPES
// ─────────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ─────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────

/**
 * Registers a new citizen account.
 * Role is always CITIZEN — staff accounts are created by admins only.
 */
export async function registerAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = RegisterSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { name, email, password } = parsed.data;

  // Check for existing account
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    // Generic error — don't confirm whether the email exists
    return {
      success: false,
      error: "An account with this email already exists",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CITIZEN", // Always CITIZEN on public registration
      isActive: true,
    },
  });

  return { success: true, message: "Account created successfully" };
}

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────

/**
 * Signs the user in via Credentials provider.
 * Returns an error string rather than throwing for form handling.
 */
export async function loginAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = LoginSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      if (errors) fieldErrors[field] = errors;
    }
    return { success: false, error: "Validation failed", fieldErrors };
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Invalid email or password. Please try again.",
          };
        default:
          return {
            success: false,
            error: "An error occurred during sign in. Please try again.",
          };
      }
    }
    // Re-throw unexpected errors (e.g., redirect from next-auth)
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────

/**
 * Signs out the current user and redirects to the login page.
 * Clears the session cookie via Auth.js.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  redirect("/login");
}
