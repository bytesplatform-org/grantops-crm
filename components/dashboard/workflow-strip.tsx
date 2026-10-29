"use client";
import Link from "next/link";
import type { AppData, ApplicationStatus } from "@/lib/types";

const STEPS: { label: string; href: string; count: (d: AppData) => number }[] = [
  { label: "Leads", href: "/leads", count: (d) => d.leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost").length },
  { label: "Matches", href: "/matches", count: (d) => d.matches.filter((m) => m.status === "New" || m.status === "Reviewing").length },
  { label: "Eligibility", href: "/applications", count: (d) => byStatus(d, ["Researching", "Eligibility Confirmed", "Preparing"]) },
  { label: "Writing", href: "/applications", count: (d) => byStatus(d, ["Writing"]) },
  { label: "Review", href: "/applications", count: (d) => byStatus(d, ["Internal Review", "Client Review"]) },
  { label: "Ready", href: "/applications", count: (d) => byStatus(d, ["Ready to Submit"]) },
  { label: "Submitted", href: "/applications", count: (d) => byStatus(d, ["Submitted"]) },
  { label: "Awarded", href: "/reports", count: (d) => byStatus(d, ["Awarded"]) },
];

function byStatus(d: AppData, s: ApplicationStatus[]) {
  return d.applications.filter((a) => s.includes(a.status)).length;
}

export function WorkflowStrip({ data }: { data: AppData }) {
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] md:grid-cols-8">
      {STEPS.map((s, i) => (
        <Link key={s.label} href={s.href} className="relative border-b border-r border-border px-3 py-2.5 transition-colors last:border-r-0 hover:bg-muted/50 md:border-b-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="mr-1 text-slate-300">{i + 1}</span>
            {s.label}
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular">{s.count(data)}</div>
        </Link>
      ))}
    </div>
  );
}
