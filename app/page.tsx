/**
 * CivicResolve — Landing Page
 *
 * Public-facing landing page. Authenticated users are redirected to
 * their role-appropriate dashboard by middleware.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Clock,
  FileSearch,
  GitBranch,
  History,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ProductPreview from "@/components/landing/ProductPreview";

export const metadata: Metadata = {
  title: "CivicResolve — Public Service Complaint Management",
  description:
    "Submit public-service complaints, track them by number, and follow resolution against SLA. Built for citizens, officers, department managers, and admins.",
};

const TRUST = [
  { label: "SLA by priority", detail: "Published deadlines, not guesswork" },
  { label: "Immutable history", detail: "Every status change is recorded" },
  { label: "Role-based access", detail: "Citizens, officers, managers, admins" },
  { label: "Public tracking", detail: "Lookup by number — no PII shown" },
];

const STEPS = [
  {
    n: "01",
    icon: Send,
    title: "Submit",
    desc: "Describe the issue, choose a category, and attach evidence. The desk routes it to the responsible department.",
  },
  {
    n: "02",
    icon: Search,
    title: "Track",
    desc: "Follow review, assignment, and work-in-progress against the SLA. Anyone with the number can see a public summary.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Resolve",
    desc: "Officers investigate, managers assign work, and citizens can accept a resolution or reopen it if the issue remains.",
  },
];

const CAPABILITIES = [
  {
    icon: GitBranch,
    title: "Automatic routing",
    desc: "Categories map to departments so intake lands with the team that can act on it.",
  },
  {
    icon: Clock,
    title: "SLA monitoring",
    desc: "Each priority has a configured window. Cases show on track, due soon, or breached.",
  },
  {
    icon: History,
    title: "Status timeline",
    desc: "Every transition is stored. Staff and citizens see the same sequence of events.",
  },
  {
    icon: Paperclip,
    title: "Evidence and notes",
    desc: "Attachments, public comments, and internal notes stay in their proper channels.",
  },
  {
    icon: Bell,
    title: "In-app notifications",
    desc: "Assignment, status, and resolution updates reach the people who need them.",
  },
  {
    icon: BarChart3,
    title: "Oversight tools",
    desc: "Managers and admins get workload, SLA, and audit views — not a shared spreadsheet.",
  },
];

const ROLES = [
  {
    title: "Citizens",
    desc: "File a complaint, attach evidence, and follow your own cases through to close.",
  },
  {
    title: "Officers",
    desc: "Work assigned cases: status changes, public updates, internal notes, and evidence.",
  },
  {
    title: "Managers",
    desc: "Assign officers, watch department SLA, and keep the queue moving.",
  },
  {
    title: "Admins",
    desc: "Configure users, categories, SLA rules, and review the immutable audit log.",
  },
];

const FAQS = [
  {
    q: "Do I need an account to track a complaint?",
    a: "No. Anyone with the complaint number can see a public summary. An account is required to submit a new complaint or view your personal case details.",
  },
  {
    q: "What appears on the public tracker?",
    a: "Number, title, status, category, department, dates, and status history. Names, comments, attachments, and officer details are never shown.",
  },
  {
    q: "How does a complaint reach the right department?",
    a: "Each category has a default department. The system routes on submit. Managers can reassign work inside their department.",
  },
  {
    q: "What does SLA mean here?",
    a: "Each priority has a configured response window. Cases display on track, due soon, or breached so citizens and staff can see whether the deadline is being met.",
  },
];

export default function HomePage() {
  return (
    <div className="landing-layout">
      <a href="#main-content" className="landing-skip">
        Skip to content
      </a>
      <PublicHeader currentPath="/" />

      <main id="main-content">
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-kicker">Public-service complaint desk</p>
              <h1 id="hero-heading" className="landing-hero-title">
                Report an issue and follow it until it is resolved
              </h1>
              <p className="landing-hero-desc">
                CivicResolve routes citizen complaints to the right department,
                tracks every status change against published SLA deadlines, and
                keeps a record anyone can look up by complaint number.
              </p>
              <div className="landing-hero-cta landing-hero-cta--start">
                <Link href="/register" className="landing-cta-primary">
                  Create a free account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/track" className="landing-cta-secondary">
                  Track a complaint
                </Link>
              </div>
              <p className="landing-hero-note">
                No account needed to look up a case by number.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="landing-trust" aria-label="Platform guarantees">
          <ul className="landing-trust-list">
            {TRUST.map((item) => (
              <li key={item.label}>
                <p className="landing-trust-label">{item.label}</p>
                <p className="landing-trust-detail">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="how-it-works"
          className="landing-how"
          aria-labelledby="how-heading"
        >
          <div className="landing-section">
            <header className="landing-section-head">
              <p className="landing-kicker">How it works</p>
              <h2 id="how-heading" className="landing-section-title">
                Three steps from intake to close
              </h2>
              <p className="landing-section-lead">
                The same workflow for every complaint — so citizens know what to
                expect, and staff work from a single, auditable path.
              </p>
            </header>
            <ol className="landing-how-grid">
              {STEPS.map(({ n, icon: Icon, title, desc }) => (
                <li key={title} className="landing-how-card">
                  <div className="landing-how-card-top">
                    <span className="landing-how-icon" aria-hidden="true">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="landing-how-n">{n}</span>
                  </div>
                  <h3 className="landing-how-title">{title}</h3>
                  <p className="landing-how-desc">{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="capabilities"
          className="landing-caps"
          aria-labelledby="caps-heading"
        >
          <div className="landing-section">
            <header className="landing-section-head">
              <p className="landing-kicker">Platform</p>
              <h2 id="caps-heading" className="landing-section-title">
                Built for accountable public-service work
              </h2>
              <p className="landing-section-lead">
                Routing, deadlines, evidence, and audit are first-class — not
                bolted on after the form is submitted.
              </p>
            </header>
            <ul className="landing-caps-grid">
              {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="landing-cap">
                  <span className="landing-cap-icon" aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="landing-cap-title">{title}</h3>
                  <p className="landing-cap-desc">{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-roles" aria-labelledby="roles-heading">
          <div className="landing-section">
            <header className="landing-section-head">
              <p className="landing-kicker">Who it serves</p>
              <h2 id="roles-heading" className="landing-section-title">
                One desk, four roles
              </h2>
              <p className="landing-section-lead">
                Access is enforced server-side. Each role sees the work they are
                responsible for — nothing more.
              </p>
            </header>
            <ul className="landing-roles-grid">
              {ROLES.map((role) => (
                <li key={role.title} className="landing-role">
                  <h3 className="landing-role-title">{role.title}</h3>
                  <p className="landing-role-desc">{role.desc}</p>
                </li>
              ))}
            </ul>
            <p className="landing-roles-link">
              <Link href="/about">
                How the platform is structured
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </section>

        <section className="landing-track" aria-labelledby="track-heading">
          <div className="landing-section landing-track-inner">
            <div className="landing-track-copy">
              <p className="landing-kicker">Public tracking</p>
              <h2 id="track-heading" className="landing-section-title">
                Already have a complaint number?
              </h2>
              <p className="landing-section-lead">
                Look up status, department, and timeline without signing in.
                Personal details, comments, and attachments stay private.
              </p>
            </div>
            <div className="landing-track-panel">
              <p className="landing-track-format">
                <FileSearch className="h-4 w-4" aria-hidden="true" />
                Format <code>CMP-YYYY-NNNNNN</code>
              </p>
              <p className="landing-track-example">
                Example seed number:{" "}
                <code>CMP-2026-000001</code>
              </p>
              <Link href="/track" className="landing-cta-primary">
                Open public tracker
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-faq" aria-labelledby="faq-heading">
          <div className="landing-section">
            <header className="landing-section-head">
              <p className="landing-kicker">Questions</p>
              <h2 id="faq-heading" className="landing-section-title">
                Before you submit
              </h2>
            </header>
            <div className="landing-faq-list">
              {FAQS.map((item) => (
                <details key={item.q} className="landing-faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-final-cta" aria-labelledby="cta-heading">
          <div className="landing-section landing-final-cta-inner">
            <Users className="landing-final-icon" aria-hidden="true" />
            <h2 id="cta-heading" className="landing-final-title">
              Open a case in minutes
            </h2>
            <p className="landing-final-lead">
              Create a citizen account to submit a complaint, or look up an
              existing case with its number.
            </p>
            <div className="landing-hero-cta">
              <Link href="/register" className="landing-cta-on-dark">
                Create a free account
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/track" className="landing-cta-ghost">
                Track a complaint
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
