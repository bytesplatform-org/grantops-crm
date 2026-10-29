"use client";
import Link from "next/link";
import { FileWarning } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MemberAvatar } from "@/components/shared/avatar";
import { deadlineTone } from "@/components/shared/deadline";
import { cn, daysLeftLabel, daysUntil, formatCompactCurrency, formatShortDate } from "@/lib/utils";
import { StatusMenu } from "./status-menu";
import type { AppRow } from "./use-application-rows";

export function ApplicationCard({ row, dragging, onDragStart, onDragEnd }: { row: AppRow; dragging?: boolean; onDragStart: () => void; onDragEnd: () => void }) {
  const { app, opp, client, completion, missingDocs } = row;
  const closed = ["Submitted", "Awarded", "Not Awarded", "Withdrawn"].includes(app.status);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", app.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-card)] transition-all hover:border-slate-300 hover:shadow-md cursor-grab active:cursor-grabbing",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/applications/${app.id}`} className="line-clamp-2 text-[13px] font-semibold leading-snug hover:text-primary" draggable={false}>
          {opp?.title ?? "Application"}
        </Link>
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">{client?.name}</div>
      <div className="mt-0.5 truncate text-[11px] text-slate-400">{opp?.agency}</div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold tabular">{formatCompactCurrency(app.fundingRequested)}</div>
          <div className="text-[11px] text-muted-foreground">requested</div>
        </div>
        <div className="text-right">
          <div className="text-xs tabular">{formatShortDate(app.deadline)}</div>
          <div className={cn("text-[11px] font-medium", closed ? "text-slate-400" : deadlineTone(app.deadline))}>
            {closed ? "Closed" : daysUntil(app.deadline) < 0 ? "Past due" : daysLeftLabel(app.deadline)}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Completion</span>
          <span className="font-medium text-foreground tabular">{completion}%</span>
        </div>
        <Progress value={completion} indicatorClassName={completion === 100 ? "bg-emerald-500" : undefined} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <div className="flex items-center gap-2">
          <MemberAvatar id={app.writerId} size="xs" />
          {missingDocs > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600" title="Missing documents">
              <FileWarning className="size-3" /> {missingDocs} missing
            </span>
          )}
        </div>
        <StatusMenu app={app} compact />
      </div>
    </div>
  );
}
