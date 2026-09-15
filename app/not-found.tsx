import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-page-inner">
        <p className="error-code">404</p>
        <h1 className="error-title">Page not found</h1>
        <p className="error-body">
          That address is not a CivicResolve page. Check the URL or return
          home.
        </p>
        <div className="error-actions">
          <Link href="/" className="landing-nav-link-primary">
            Home
          </Link>
          <Link href="/track" className="landing-nav-link-outline">
            Track a complaint
          </Link>
        </div>
      </div>
    </div>
  );
}
