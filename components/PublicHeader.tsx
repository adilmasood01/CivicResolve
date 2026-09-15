"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/track", label: "Track complaint" },
] as const;

interface PublicHeaderProps {
  currentPath?: string;
}

export default function PublicHeader({ currentPath }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="landing-nav">
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

        <nav className="landing-nav-links hidden sm:flex" aria-label="Public">
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
          <Link href="/login" className="landing-nav-link-outline hidden sm:inline-flex">
            Sign in
          </Link>
          <Link href="/register" className="landing-nav-link-primary hidden sm:inline-flex">
            Get started
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--cr-border)] text-[var(--cr-text)] sm:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--cr-border)] px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1" aria-label="Public mobile">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  currentPath === href
                    ? "landing-nav-link landing-nav-link-active py-2"
                    : "landing-nav-link py-2"
                }
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-[var(--cr-border)] pt-3">
              <Link href="/login" className="landing-nav-link-outline flex-1 justify-center">
                Sign in
              </Link>
              <Link href="/register" className="landing-nav-link-primary flex-1 justify-center">
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
