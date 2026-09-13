import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/track", label: "Track complaint" },
] as const;

interface PublicHeaderProps {
  currentPath?: string;
}

export default function PublicHeader({ currentPath }: PublicHeaderProps) {
  return (
    <header className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-brand">
          <ShieldCheck className="landing-brand-icon" aria-hidden="true" />
          <span className="landing-brand-name">CivicResolve</span>
        </Link>

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
          <Link href="/login" className="landing-nav-link-outline">
            Sign in
          </Link>
          <Link href="/register" className="landing-nav-link-primary">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
