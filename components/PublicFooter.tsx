import Link from "next/link";
import Image from "next/image";

const PRODUCT_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/track", label: "Track a complaint" },
] as const;

const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create an account" },
] as const;

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <Link href="/" className="landing-brand">
            <Image
              src="/CivicResolve.jpg"
              alt="CivicResolve Logo"
              width={32}
              height={32}
              className="landing-brand-img"
            />
            <span className="landing-brand-name">CivicResolve</span>
          </Link>
          <p className="landing-footer-tagline">
            A public-service complaint desk for citizens and the departments that
            serve them.
          </p>
        </div>

        <nav className="landing-footer-col" aria-label="Product">
          <p className="landing-footer-heading">Product</p>
          <ul>
            {PRODUCT_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="landing-footer-col" aria-label="Account">
          <p className="landing-footer-heading">Account</p>
          <ul>
            {ACCOUNT_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="landing-footer-legal">
        &copy; {year} CivicResolve. A public-service platform.
      </p>
    </footer>
  );
}
