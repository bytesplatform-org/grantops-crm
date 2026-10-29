"use client";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Application, ApplicationSection, Client, Opportunity, SectionStatus } from "@/lib/types";
import { cn, daysLeftLabel, formatDate, wordCount } from "@/lib/utils";

export const STATUS_DOT: Record<SectionStatus, string> = {
  "Not Started": "bg-slate-300",
  Drafting: "bg-sky-500",
  "In Review": "bg-amber-500",
  Complete: "bg-emerald-500",
};

export function SectionNav({
  app,
  client,
  opportunity,
  activeId,
  onSelect,
}: {
  app: Application;
  client?: Client;
  opportunity?: Opportunity;
  activeId: string;
  onSelect: (s: ApplicationSection) => void;
}) {
  const complete = app.sections.filter((s) => s.status === "Complete").length;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{opportunity?.agency}</div>
        <Link href={`/applications/${app.id}`} className="mt-1 block text-sm font-semibold leading-snug hover:text-primary">
          {opportunity?.title}
        </Link>
        <div className="mt-1 text-xs text-muted-foreground">{client?.name}</div>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <CalendarClock className="size-3.5 text-muted-foreground" />
          <span>{formatDate(app.deadline)}</span>
          <span className="text-muted-foreground">· {daysLeftLabel(app.deadline)}</span>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">Sections complete</span>
            <span className="font-medium tabular">
              {complete} of {app.sections.length}
            </span>
          </div>
          <Progress value={(complete / Math.max(1, app.sections.length)) * 100} indicatorClassName="bg-emerald-500" />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin" aria-label="Grant sections">
        <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grant sections</div>
        <ul className="space-y-0.5">
          {app.sections.map((s, i) => {
            const words = wordCount(s.content);
            const over = words > s.wordLimit;
            const active = s.id === activeId;
            return (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s)}
                  className={cn("flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors", active ? "bg-primary-soft" : "hover:bg-muted")}
                  aria-current={active ? "true" : undefined}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", STATUS_DOT[s.status])} title={s.status} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px]", active ? "font-semibold text-primary" : "font-medium")}>
                      {i + 1}. {s.title}
                    </span>
                    <span className={cn("block text-[11px] tabular", over ? "text-red-600" : "text-muted-foreground")}>
                      {words.toLocaleString()} / {s.wordLimit.toLocaleString()} words · {s.status}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
