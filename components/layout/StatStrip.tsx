import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warn" | "danger" | "info";
  icon?: ReactNode;
}

interface StatStripProps {
  items: StatItem[];
  className?: string;
}

const toneValue: Record<NonNullable<StatItem["tone"]>, string> = {
  default: "text-foreground",
  success: "text-[var(--cr-success)]",
  warn: "text-[var(--cr-warn)]",
  danger: "text-[var(--cr-danger)]",
  info: "text-[var(--cr-info)]",
};

export function StatStrip({ items, className }: StatStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 bg-card px-4 py-3.5"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {item.icon}
            <span>{item.label}</span>
          </div>
          <p
            className={cn(
              "text-xl font-semibold tracking-tight tabular-nums",
              toneValue[item.tone ?? "default"]
            )}
          >
            {item.value}
          </p>
          {item.hint ? (
            <p className="text-[11px] text-muted-foreground">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
