import { Check } from "lucide-react";
import type { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS: { label: string; statuses: ApplicationStatus[] }[] = [
  { label: "Eligibility", statuses: ["Researching", "Eligibility Confirmed", "Preparing"] },
  { label: "Writing", statuses: ["Writing"] },
  { label: "Review", statuses: ["Internal Review", "Client Review"] },
  { label: "Ready", statuses: ["Ready to Submit"] },
  { label: "Submitted", statuses: ["Submitted"] },
  { label: "Outcome", statuses: ["Awarded", "Not Awarded"] },
];

export function WorkflowStepper({ status }: { status: ApplicationStatus }) {
  const current = STEPS.findIndex((s) => s.statuses.includes(status));
  const outcomeLabel = status === "Awarded" ? "Awarded" : status === "Not Awarded" ? "Not Awarded" : "Outcome";
  return (
    <ol className="flex w-full items-center">
      {STEPS.map((s, i) => {
        const done = current > i || (i === STEPS.length - 1 && current === i);
        const active = current === i && i !== STEPS.length - 1;
        const label = i === STEPS.length - 1 ? outcomeLabel : s.label;
        const negative = i === STEPS.length - 1 && status === "Not Awarded";
        return (
          <li key={s.label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                  done && !negative && "border-emerald-600 bg-emerald-600 text-white",
                  negative && "border-red-500 bg-red-500 text-white",
                  active && "border-primary bg-primary text-white ring-4 ring-primary/15",
                  !done && !active && "border-slate-300 bg-card text-slate-400",
                )}
              >
                {done && !negative ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("hidden whitespace-nowrap text-xs font-medium sm:inline", active ? "text-foreground" : done ? "text-slate-700" : "text-muted-foreground")}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <span className={cn("mx-2 h-px flex-1", current > i ? "bg-emerald-500" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
