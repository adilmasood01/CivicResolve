/**
 * Decorative product preview for the public landing hero.
 * Mirrors the public-tracking / case workspace visual language.
 */
export default function ProductPreview() {
  return (
    <div className="landing-preview" aria-hidden="true">
      <div className="landing-preview-chrome">
        <span className="landing-preview-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="landing-preview-chrome-label">Case workspace</span>
      </div>

      <div className="landing-preview-body">
        <div className="landing-preview-header">
          <div>
            <p className="landing-preview-number">CMP-2026-000184</p>
            <p className="landing-preview-title">Broken streetlight on Oak Avenue</p>
            <p className="landing-preview-meta">Public Works · Street lighting</p>
          </div>
          <span className="landing-preview-status">In progress</span>
        </div>

        <div className="landing-preview-sla">
          <div className="landing-preview-sla-row">
            <span className="landing-preview-sla-chip">On track · 18h remaining</span>
            <span className="landing-preview-sla-pct">42%</span>
          </div>
          <div className="landing-preview-sla-bar">
            <span style={{ width: "42%" }} />
          </div>
        </div>

        <p className="landing-preview-timeline-label">Status timeline</p>
        <ol className="landing-preview-timeline">
          <li>
            <span className="landing-preview-dot landing-preview-dot--done" />
            <span>Submitted</span>
            <time>12 Mar, 09:14</time>
          </li>
          <li>
            <span className="landing-preview-dot landing-preview-dot--done" />
            <span>Under review</span>
            <time>12 Mar, 10:02</time>
          </li>
          <li>
            <span className="landing-preview-dot landing-preview-dot--done" />
            <span>Assigned</span>
            <time>12 Mar, 11:40</time>
          </li>
          <li className="is-current">
            <span className="landing-preview-dot landing-preview-dot--current" />
            <span>In progress</span>
            <time>13 Mar, 08:21</time>
          </li>
        </ol>
      </div>
    </div>
  );
}
