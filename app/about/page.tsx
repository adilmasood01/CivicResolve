import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "About",
  description:
    "CivicResolve is a public-service complaint platform for citizens and government departments.",
};

const STEPS = [
  {
    n: "1",
    title: "Submit",
    body: "Describe the issue, choose a category, and attach evidence. The system routes it to the responsible department.",
  },
  {
    n: "2",
    title: "Track",
    body: "Follow status changes against an SLA deadline. Anyone with the complaint number can see a public summary.",
  },
  {
    n: "3",
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
          <p className="public-kicker">About</p>
          <h1 className="public-title">CivicResolve</h1>
          <p className="public-lead">
            CivicResolve is a portfolio demonstration of a government complaint
            desk: citizens report public-service issues, and staff handle them
            through a controlled workflow with audit history and SLA monitoring.
          </p>

          <section className="about-steps" aria-labelledby="about-how">
            <h2 id="about-how" className="about-section-heading">
              How it works
            </h2>
            <ol className="landing-steps">
              {STEPS.map(({ n, title, body }) => (
                <li key={title} className="landing-step">
                  <span className="landing-step-num" aria-hidden="true">
                    {n}
                  </span>
                  <div>
                    <h3 className="landing-step-title">{title}</h3>
                    <p className="landing-step-desc">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="about-who" aria-labelledby="about-who">
            <h2 id="about-who" className="about-section-heading">
              Who uses it
            </h2>
            <dl className="about-roles-list">
              <div>
                <dt>Citizens</dt>
                <dd>Submit and follow their own complaints.</dd>
              </div>
              <div>
                <dt>Officers</dt>
                <dd>Work assigned cases and post updates.</dd>
              </div>
              <div>
                <dt>Managers</dt>
                <dd>Assign work and watch department SLA.</dd>
              </div>
              <div>
                <dt>Admins</dt>
                <dd>Manage users, categories, and audit logs.</dd>
              </div>
            </dl>
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
