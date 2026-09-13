/**
 * CivicResolve — Landing Page
 *
 * Public-facing landing page. Authenticated users are redirected to
 * their role-appropriate dashboard by middleware.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Clock,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "CivicResolve — Public Service Complaint Management",
};

export default function HomePage() {
  return (
    <div className="landing-layout">
      {/* Navbar */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <ShieldCheck className="landing-brand-icon" aria-hidden="true" />
            <span className="landing-brand-name">CivicResolve</span>
          </div>
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

      {/* Hero */}
      <main>
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-hero-badge">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Secure &amp; Trusted Platform</span>
            </div>
            <h1 className="landing-hero-title">
              Your voice in{" "}
              <span className="landing-hero-accent">public service</span>
            </h1>
            <p className="landing-hero-desc">
              CivicResolve connects citizens with the government departments
              responsible for resolving their issues — transparently, securely,
              and efficiently.
            </p>
            <div className="landing-hero-cta">
              <Link href="/register" className="landing-cta-primary">
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className="landing-cta-secondary">
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-features" aria-labelledby="features-heading">
          <div className="landing-features-inner">
            <h2 id="features-heading" className="landing-features-title">
              How CivicResolve works
            </h2>
            <div className="landing-features-grid">
              {[
                {
                  icon: FileText,
                  title: "Submit a complaint",
                  desc: "Describe your public service issue and submit it in minutes. We route it to the right department automatically.",
                },
                {
                  icon: Clock,
                  title: "Track in real time",
                  desc: "Monitor the status of your complaint as it moves through the system, with updates at every step.",
                },
                {
                  icon: Users,
                  title: "Get it resolved",
                  desc: "Dedicated officers and managers ensure your complaint is addressed within defined SLA timeframes.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="landing-feature-card">
                  <div className="landing-feature-icon">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="landing-feature-title">{title}</h3>
                  <p className="landing-feature-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p className="landing-footer-text">
          &copy; {new Date().getFullYear()} CivicResolve. A public service platform.
        </p>
      </footer>
    </div>
  );
}
