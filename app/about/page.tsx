import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Clock, ShieldCheck, Users } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "About",
  description:
    "CivicResolve is a public-service complaint platform for citizens and government departments.",
};

const STEPS = [
  {
    icon: FileText,
    title: "Submit",
    body: "Describe the issue, choose a category, and attach evidence. The system routes it to the responsible department.",
  },
  {
    icon: Clock,
    title: "Track",
    body: "Follow status changes against an SLA deadline. Anyone with the complaint number can see a public summary.",
  },
  {
    icon: Users,
    title: "Resolve",
    body: "Officers investigate, managers assign work, and citizens can accept or reopen a resolution.",
  },
];

export default function AboutPage() {
  return (
    <div className="landing-layout">
      <PublicHeader currentPath="/about" />

      <main className="public-page">
        <div className="public-page-inner">
          <p className="public-kicker">About the platform</p>
          <h1 className="public-title">How CivicResolve works</h1>
          <p className="public-lead">
            CivicResolve is a portfolio demonstration of a government complaint
            desk: citizens report public-service issues, and staff handle them
            through a controlled workflow with audit history and SLA monitoring.
          </p>

          <div className="landing-features-grid" style={{ marginBottom: "2rem" }}>
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h2 className="landing-feature-title">{title}</h2>
                <p className="landing-feature-desc">{body}</p>
              </div>
            ))}
          </div>

          <section className="about-panel">
            <div className="about-panel-icon">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="about-panel-title">Who uses it</h2>
              <ul className="about-list">
                <li>
                  <strong>Citizens</strong> submit and follow their own
                  complaints.
                </li>
                <li>
                  <strong>Officers</strong> work assigned cases and post updates.
                </li>
                <li>
                  <strong>Managers</strong> assign work and watch department SLA.
                </li>
                <li>
                  <strong>Admins</strong> manage users, categories, and audit
                  logs.
                </li>
              </ul>
            </div>
          </section>

          <div className="about-actions">
            <Link href="/track" className="landing-nav-link-outline">
              Track a complaint
            </Link>
            <Link href="/register" className="landing-nav-link-primary">
              Create an account
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
