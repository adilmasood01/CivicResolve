"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  Building2,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getDashboardPath } from "@/lib/route-access";
import type { SessionUser } from "@/types";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/track", label: "Track complaint" },
] as const;

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Citizen",
  OFFICER: "Officer",
  DEPARTMENT_MANAGER: "Manager",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  CITIZEN: "nav-badge-citizen",
  OFFICER: "nav-badge-officer",
  DEPARTMENT_MANAGER: "nav-badge-manager",
  ADMIN: "nav-badge-admin",
};

interface PublicHeaderProps {
  currentPath?: string;
  user?: SessionUser | null;
}

function SignOutButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      id="public-nav-logout-btn"
      type="submit"
      className={className ?? "auth-nav-dropdown-item auth-nav-logout"}
      role="menuitem"
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{pending ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}

export default function PublicHeader({ currentPath, user }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: clientSession } = useSession();
  const sessionUser =
    user !== undefined
      ? user
      : (clientSession?.user as SessionUser | undefined) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setUserMenuOpen(false);
      }
    }
    if (open || userMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, userMenuOpen]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 640) {
        setOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const dashboardPath = sessionUser
    ? getDashboardPath(sessionUser.role)
    : "/dashboard";
  const roleLabel = sessionUser
    ? ROLE_LABELS[sessionUser.role] ?? sessionUser.role
    : "";
  const roleBadgeClass = sessionUser
    ? ROLE_COLORS[sessionUser.role] ?? "nav-badge-citizen"
    : "";

  return (
    <header className={`landing-nav${open ? " landing-nav--open" : ""}`}>
      <div className="landing-nav-inner">
        <Link href="/" className="landing-brand">
          <Image
            src="/CivicResolve.jpg"
            alt="CivicResolve Logo"
            width={32}
            height={32}
            className="landing-brand-img"
            priority
          />
          <span className="landing-brand-name">CivicResolve</span>
        </Link>

        {/* Desktop nav */}
        <nav className="landing-nav-links" aria-label="Public">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                currentPath === href
                  ? "landing-nav-link landing-nav-link-active"
                  : "landing-nav-link"
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="landing-nav-actions">
          {sessionUser ? (
            <div
              ref={userMenuRef}
              className="auth-nav-user-menu relative landing-nav-desktop-only"
            >
              <button
                id="landing-user-menu-btn"
                type="button"
                className="auth-nav-user-btn"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <div className="auth-nav-avatar overflow-hidden" aria-hidden="true">
                  {sessionUser.image ? (
                    <img
                      src={sessionUser.image}
                      alt={sessionUser.name ?? "Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : sessionUser.name ? (
                    sessionUser.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="auth-nav-user-info">
                  <span className="auth-nav-user-name">
                    {sessionUser.name ?? sessionUser.email}
                  </span>
                  <span className={`auth-nav-badge ${roleBadgeClass}`}>
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown
                  className={`auth-nav-chevron ${userMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {userMenuOpen && (
                <div
                  className="auth-nav-dropdown"
                  role="menu"
                  aria-labelledby="landing-user-menu-btn"
                >
                  <div className="auth-nav-dropdown-header flex items-center gap-3">
                    <div
                      className="auth-nav-avatar h-10 w-10 text-sm overflow-hidden shrink-0"
                      aria-hidden="true"
                    >
                      {sessionUser.image ? (
                        <img
                          src={sessionUser.image}
                          alt={sessionUser.name ?? "Avatar"}
                          className="h-full w-full object-cover"
                        />
                      ) : sessionUser.name ? (
                        sessionUser.name.charAt(0).toUpperCase()
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="auth-nav-dropdown-name truncate">
                        {sessionUser.name ?? "User"}
                      </p>
                      <p className="auth-nav-dropdown-email">
                        {sessionUser.email}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {roleLabel}
                      </p>
                      {sessionUser.departmentId && (
                        <div className="auth-nav-dropdown-dept">
                          <Building2 className="h-3 w-3" aria-hidden="true" />
                          <span>Department assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="auth-nav-dropdown-divider" />
                  <Link
                    href={dashboardPath}
                    className="auth-nav-dropdown-item"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="auth-nav-dropdown-item"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    Your profile
                  </Link>
                  <div className="auth-nav-dropdown-divider" />
                  <form action={logoutAction}>
                    <SignOutButton />
                  </form>
                </div>
              )}
            </div>
          ) : (

            <>
              <Link
                href="/login"
                className="landing-nav-link-outline landing-nav-desktop-only"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="landing-nav-link-primary landing-nav-desktop-only"
              >
                Get started
              </Link>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="landing-nav-hamburger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => {
              setOpen((v) => !v);
              setUserMenuOpen(false);
            }}
          >
            {open ? (
              <X className="landing-nav-hamburger-icon" />
            ) : (
              <Menu className="landing-nav-hamburger-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`landing-nav-mobile-drawer${open ? " landing-nav-mobile-drawer--open" : ""}`}
        aria-hidden={!open}
      >
        <nav className="landing-nav-mobile-links" aria-label="Public mobile">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                currentPath === href
                  ? "landing-nav-mobile-link landing-nav-link-active"
                  : "landing-nav-mobile-link"
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="landing-nav-mobile-actions">
          {sessionUser ? (
            <div className="flex flex-col gap-2 w-full pt-1">
              <div className="flex items-center gap-2.5 px-1 py-2">
                <div
                  className="auth-nav-avatar h-9 w-9 text-sm overflow-hidden shrink-0"
                  aria-hidden="true"
                >
                  {sessionUser.image ? (
                    <img
                      src={sessionUser.image}
                      alt={sessionUser.name ?? "Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : sessionUser.name ? (
                    sessionUser.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {sessionUser.name ?? sessionUser.email}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`auth-nav-badge ${roleBadgeClass}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href={dashboardPath}
                className="landing-nav-link-primary landing-nav-mobile-action-btn"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="landing-nav-link-outline landing-nav-mobile-action-btn"
                onClick={() => setOpen(false)}
              >
                Your profile
              </Link>
              <form action={logoutAction} className="w-full">
                <SignOutButton className="landing-nav-link-outline landing-nav-mobile-action-btn text-destructive border-destructive/20 hover:bg-destructive/10 justify-center w-full" />
              </form>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="landing-nav-link-outline landing-nav-mobile-action-btn"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="landing-nav-link-primary landing-nav-mobile-action-btn"
                onClick={() => setOpen(false)}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
