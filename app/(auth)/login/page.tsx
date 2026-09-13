"use client";

/**
 * CivicResolve — Login Page
 *
 * Email/password sign-in form with React Hook Form + Zod validation.
 * On success, fetches session and redirects to the role-appropriate dashboard.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/actions/auth";
import { getDashboardPath } from "@/lib/auth";

// ── Schema ────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

// ── Form Inner Component ──────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("password", data.password);

      const result = await loginAction(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      // Fetch the session to determine the role-based redirect
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role ?? "CITIZEN";
        const destination = callbackUrl ?? getDashboardPath(role);
        router.push(destination);
        router.refresh();
      } catch {
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-logo">
          <ShieldCheck className="auth-logo-icon" aria-hidden="true" />
        </div>
        <h1 className="auth-title">CivicResolve</h1>
        <p className="auth-subtitle">Sign in to your account</p>
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
        aria-label="Sign in form"
      >
        {/* Email */}
        <div className="auth-field">
          <Label htmlFor="login-email" className="auth-label">
            Email address
          </Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className="auth-input"
            {...register("email")}
          />
          {errors.email && (
            <p id="login-email-error" className="auth-field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="auth-field">
          <Label htmlFor="login-password" className="auth-label">
            Password
          </Label>
          <div className="auth-input-wrapper">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
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
              id="login-password-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          id="login-submit"
          type="submit"
          disabled={isPending}
          className="auth-submit-btn"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Signing in…</span>
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="auth-footer-text">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="auth-link">
          Create account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-card text-center p-8 text-slate-400">
          Loading login form…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
