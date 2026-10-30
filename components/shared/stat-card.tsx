import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatTrend {
  value: string;
  label: string;
  direction?: "up" | "down" | "neutral";
}

const ICON_TONES = {
  brand: "bg-brand text-zinc-900",
  rose: "bg-rose-100 text-rose-600",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  iconTone = "brand",
  hint,
  trend,
  chart,
  highlight = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconTone?: keyof typeof ICON_TONES;
  hint?: React.ReactNode;
  /** Change line under the value, e.g. "+3 opened in the last 30 days". */
  trend?: StatTrend;
  /** Small decorative chart drawn in the bottom-right corner. */
  chart?: React.ReactNode;
  /** Dark featured card, used for the lead KPI of a page. */
  highlight?: boolean;
  className?: string;
}) {
  const up = trend?.direction !== "down";
  return (
    <Card className={cn("relative overflow-hidden p-5", highlight && "border-dark bg-dark text-white", className)}>
      {Icon && !highlight && (
        <span className={cn("mb-3 flex size-11 items-center justify-center rounded-full", ICON_TONES[iconTone])}>
          <Icon className="size-5" />
        </span>
      )}
      <div className={cn("text-[14px]", highlight ? "text-zinc-300" : "text-zinc-600")}>{label}</div>
      <div className={cn("mt-1.5 font-bold tracking-tight tabular", highlight ? "text-[34px]" : "text-[28px]")}>{value}</div>
      {trend && (
        <div className={cn("mt-1.5 flex items-center gap-1 truncate text-[13px]", chart && "pr-24", highlight ? "text-zinc-300" : "text-muted-foreground")}>
          {trend.direction !== "neutral" &&
            (up ? <ArrowUp className="size-3.5 shrink-0 text-emerald-500" /> : <ArrowDown className="size-3.5 shrink-0 text-red-500" />)}
          <span className={cn("font-medium", trend.direction === "neutral" ? "" : up ? "text-emerald-500" : "text-red-500")}>{trend.value}</span>
          <span className="truncate">{trend.label}</span>
        </div>
      )}
      {hint && !trend && <div className={cn("mt-1 truncate text-[13px]", highlight ? "text-zinc-400" : "text-muted-foreground")}>{hint}</div>}
      {chart && <div className="pointer-events-none absolute bottom-5 right-5" aria-hidden>{chart}</div>}
    </Card>
  );
}
