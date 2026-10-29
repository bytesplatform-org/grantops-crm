import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  change,
  changeLabel = "vs last quarter",
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  hint?: React.ReactNode;
  className?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular">{value}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {change !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", positive ? "text-emerald-600" : "text-red-600")}>
            {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change)}%
          </span>
        )}
        <span className="text-muted-foreground truncate">{hint ?? (change !== undefined ? changeLabel : "")}</span>
      </div>
    </Card>
  );
}
