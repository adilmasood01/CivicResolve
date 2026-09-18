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
          <Link href="/login" className="landing-nav-link-outline landing-nav-desktop-only">
            Sign in
          </Link>
          <Link href="/register" className="landing-nav-link-primary landing-nav-desktop-only">
            Get started
          </Link>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="landing-nav-hamburger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="landing-nav-hamburger-icon" /> : <Menu className="landing-nav-hamburger-icon" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`landing-nav-mobile-drawer${open ? " landing-nav-mobile-drawer--open" : ""}`} aria-hidden={!open}>
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
        </div>
      </div>
    </header>
  );
}
