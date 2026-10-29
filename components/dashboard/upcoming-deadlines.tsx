"use client";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import type { AppData } from "@/lib/types";
import { upcomingDeadlines } from "@/lib/selectors";
import { cn, daysLeftLabel, daysUntil, formatDate } from "@/lib/utils";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

export function UpcomingDeadlines({ data, limit = 5 }: { data: AppData; limit?: number }) {
  const apps = upcomingDeadlines(data, limit);
  if (!apps.length) return <EmptyState icon={CalendarClock} title="No upcoming deadlines" />;
  return (
    <ul className="divide-y divide-border">
      {apps.map((a) => {
        const opp = data.opportunities.find((o) => o.id === a.opportunityId);
        const client = data.clients.find((c) => c.id === a.clientId);
        const d = daysUntil(a.deadline);
        const date = new Date(a.deadline);
        return (
          <li key={a.id}>
            <Link href={`/applications/${a.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
              <div className="flex w-11 shrink-0 flex-col items-center rounded-md border border-border bg-card py-1">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{date.toLocaleDateString("en-US", { month: "short" })}</span>
                <span className="text-base font-semibold leading-none tabular">{date.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">
                  <span className="text-muted-foreground">{opp?.agencyCode} · </span>
                  {opp?.title}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">Client: {client?.name}</div>
              </div>
              <div className="hidden shrink-0 sm:block">
                <ApplicationStatusBadge status={a.status} />
              </div>
              <div className="w-24 shrink-0 text-right">
                <div className={cn("text-xs font-semibold", d <= 5 ? "text-red-600" : d <= 14 ? "text-amber-600" : "text-slate-600")}>{daysLeftLabel(a.deadline)}</div>
                <div className="text-[11px] text-muted-foreground">{formatDate(a.deadline, { month: "short", day: "numeric" })}</div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
