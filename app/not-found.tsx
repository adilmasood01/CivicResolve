import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="forbidden-page">
      <div className="forbidden-card">
        <div className="forbidden-icon-wrap">
          <FileQuestion className="forbidden-icon" aria-hidden="true" />
        </div>
        <h1 className="forbidden-title">Page not found</h1>
        <p className="forbidden-body">
          That address is not a CivicResolve page. Check the URL or return
          home.
        </p>
        <div className="forbidden-actions">
          <Link href="/" className="forbidden-btn-primary">
            Home
          </Link>
          <Link href="/track" className="forbidden-btn-outline">
            Track a complaint
          </Link>
        </div>
      </div>
    </div>
  );
}
