import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  /** Use a bordered surface instead of open section */
  bordered?: boolean;
}

export function Section({
  children,
  className,
  title,
  description,
  actions,
  bordered = false,
}: SectionProps) {
  return (
    <section
      className={cn(
        "mb-8",
        bordered && "rounded-lg border border-border bg-card p-4 sm:p-5",
        className
      )}
    >
      {(title || actions) && (
        <SectionHeader title={title ?? ""} description={description} actions={actions} />
      )}
      {children}
    </section>
  );
}
