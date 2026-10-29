import * as React from "react";
import { cn } from "@/lib/utils";

export function InfoRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2 text-sm", className)}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

export function InfoGrid({ items, className }: { items: { label: string; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3", className)}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{i.label}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TagList({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((t) => (
        <span key={t} className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs text-slate-700">
          {t}
        </span>
      ))}
    </div>
  );
}
