"use client";

/**
 * CivicResolve — Registration Page
 *
 * Public registration form. All new accounts receive the CITIZEN role.
 * Uses React Hook Form + Zod for validation.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/app/actions/auth";

// ── Schema ────────────────────────────────────────────────────
const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof RegisterSchema>;

// ── Component ─────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("email", data.email);
      formData.set("password", data.password);
      formData.set("confirmPassword", data.confirmPassword);

      const result = await registerAction(formData);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof RegisterFormData, {
              message: messages[0],
            });
          }
        }
        setServerError(result.error);
        return;
      }

      setSuccess(true);
      // Redirect to login after a brief moment to show success state
      setTimeout(() => router.push("/login"), 1800);
    });
  };

  if (success) {
    return (
      <div className="auth-card">
        <div className="auth-success">
          <CheckCircle2 className="auth-success-icon" aria-hidden="true" />
          <h2 className="auth-success-title">Account created!</h2>
          <p className="auth-success-msg">
            Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-logo overflow-hidden p-0">
          <Image
            src="/CivicResolve.jpg"
            alt="CivicResolve Logo"
            width={44}
            height={44}
            className="h-full w-full object-cover rounded-md"
            priority
          />
        </div>
        <h1 className="auth-title">CivicResolve</h1>
        <p className="auth-subtitle">Create your account</p>
      </div>

      {/* Error Banner */}
      {serverError && (
        <div className="auth-error-banner" role="alert" aria-live="polite">
          <AlertCircle className="auth-error-icon" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="auth-form"
        aria-label="Create account form"
      >
        {/* Full Name */}
        <div className="auth-field">
          <Label htmlFor="register-name" className="auth-label">
            Full name
          </Label>
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            className="auth-input"
            {...register("name")}
          />
          {errors.name && (
            <p
              id="register-name-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="auth-field">
          <Label htmlFor="register-email" className="auth-label">
            Email address
          </Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            className="auth-input"
            {...register("email")}
          />
          {errors.email && (
            <p
              id="register-email-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="auth-field">
          <Label htmlFor="register-password" className="auth-label">
            Password
          </Label>
          <div className="auth-input-wrapper">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 chars, mixed case + number"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "register-password-error" : undefined
              }
              className="auth-input auth-input-padded"
              {...register("password")}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="register-password-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="auth-field">
          <Label htmlFor="register-confirm" className="auth-label">
            Confirm password
          </Label>
          <div className="auth-input-wrapper">
            <Input
              id="register-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "register-confirm-error" : undefined
              }
              className="auth-input auth-input-padded"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              id="register-confirm-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          id="register-submit"
          type="submit"
          disabled={isPending}
          className="auth-submit-btn"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Creating account…</span>
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="auth-footer-text">
        Already have an account?{" "}
        <Link href="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
