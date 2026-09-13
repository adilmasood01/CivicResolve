import type { Metadata } from "next";
import { Calendar, Building2, Tag, AlertCircle } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { TrackForm } from "./TrackForm";
import { ComplaintStatusBadge, STATUS_CONFIG } from "@/components/complaints/ComplaintStatusBadge";
import { getPublicComplaintByNumber } from "@/services/complaint.service";
import { trackComplaintSchema } from "@/schemas/complaint.schema";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Track a complaint",
  description:
    "Look up a CivicResolve complaint by number. No login required.",
};

interface TrackPageProps {
  searchParams: Promise<{ number?: string }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const rawNumber = params.number?.trim() ?? "";

  let validationError: string | null = null;
  let notFound = false;
  let result = null;

  if (rawNumber) {
    const parsed = trackComplaintSchema.safeParse({
      complaintNumber: rawNumber,
    });

    if (!parsed.success) {
      validationError =
        parsed.error.issues[0]?.message ??
        "Use a complaint number like CMP-2026-000001";
    } else {
      result = await getPublicComplaintByNumber(parsed.data.complaintNumber);
      if (!result) notFound = true;
    }
  }

  return (
    <div className="landing-layout">
      <PublicHeader currentPath="/track" />

      <main className="public-page">
        <div className="public-page-inner">
          <p className="public-kicker">Public tracking</p>
          <h1 className="public-title">Track a complaint</h1>
          <p className="public-lead">
            Enter your complaint number to see its current status. Personal
            details, comments, and officer names are never shown here.
          </p>

          <TrackForm defaultValue={rawNumber} />

          {validationError && (
            <div className="track-alert" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{validationError}</p>
            </div>
          )}

          {notFound && (
            <div className="track-alert" role="status">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                No public record found for that number. Check the digits and try
                again, or sign in to view your own complaints.
              </p>
            </div>
          )}

          {result && (
            <article className="track-result">
              <header className="track-result-header">
                <div>
                  <p className="track-result-number">{result.complaintNumber}</p>
                  <h2 className="track-result-title">{result.title}</h2>
                </div>
                <ComplaintStatusBadge status={result.status} />
              </header>

              <dl className="track-meta">
                <div>
                  <dt>
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    Category
                  </dt>
                  <dd>{result.categoryName}</dd>
                </div>
                <div>
                  <dt>
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Department
                  </dt>
                  <dd>{result.departmentName}</dd>
                </div>
                <div>
                  <dt>
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Submitted
                  </dt>
                  <dd>{formatDate(result.submittedAt)}</dd>
                </div>
                <div>
                  <dt>
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Last update
                  </dt>
                  <dd>{formatDateTime(result.updatedAt)}</dd>
                </div>
              </dl>

              {result.timeline.length > 0 && (
                <section aria-labelledby="timeline-heading">
                  <h3 id="timeline-heading" className="track-timeline-title">
                    Status timeline
                  </h3>
                  <ol className="track-timeline">
                    {result.timeline.map((event, index) => (
                      <li key={`${event.toStatus}-${index}`}>
                        <span className="track-timeline-dot" aria-hidden="true" />
                        <div>
                          <p className="track-timeline-status">
                            {STATUS_CONFIG[event.toStatus]?.label ??
                              event.toStatus}
                          </p>
                          <p className="track-timeline-time">
                            {formatDateTime(event.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </article>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
