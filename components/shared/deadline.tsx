import { CalendarClock } from "lucide-react";
import { cn, daysLeftLabel, daysUntil, formatDate } from "@/lib/utils";

export function deadlineTone(iso: string) {
  const d = daysUntil(iso);
  if (d < 0) return "text-slate-500";
  if (d <= 5) return "text-red-600";
  if (d <= 14) return "text-amber-600";
  return "text-slate-600";
}

export function Deadline({ date, className, showIcon = false, compact = false }: { date: string; className?: string; showIcon?: boolean; compact?: boolean }) {
  const past = daysUntil(date) < 0;
  return (
    <span className={cn("inline-flex flex-col leading-tight", className)}>
      <span className="inline-flex items-center gap-1 text-sm tabular">
        {showIcon && <CalendarClock className="size-3.5 text-muted-foreground" />}
        {formatDate(date, compact ? { month: "short", day: "numeric" } : undefined)}
      </span>
      <span className={cn("text-[11px] font-medium", deadlineTone(date))}>{past ? "Closed" : daysLeftLabel(date)}</span>
    </span>
  );
}
