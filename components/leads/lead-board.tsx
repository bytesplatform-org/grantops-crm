"use client";
import { useState } from "react";
import { CalendarClock, GripVertical } from "lucide-react";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/types";
import { moveLeadStage } from "@/lib/data-service";
import { MemberAvatar } from "@/components/shared/avatar";
import { LEAD_STAGE_VARIANT } from "@/components/shared/status-badge";
import { cn, daysUntil, formatCompactCurrency, formatShortDate } from "@/lib/utils";
import { toast } from "sonner";

const DOT: Record<string, string> = {
  secondary: "bg-slate-400",
  info: "bg-sky-500",
  default: "bg-primary",
  violet: "bg-violet-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-red-500",
};

export function LeadBoard({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStage | null>(null);

  const drop = (stage: LeadStage) => {
    const lead = leads.find((l) => l.id === dragId);
    if (lead && lead.stage !== stage) {
      moveLeadStage(lead.id, stage);
      toast.success(`${lead.company} moved to ${stage}`);
    }
    setDragId(null);
    setOver(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
      {LEAD_STAGES.map((stage) => {
        const items = leads.filter((l) => l.stage === stage);
        const total = items.reduce((s, l) => s + l.estimatedValue, 0);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(stage);
            }}
            onDragLeave={() => setOver((o) => (o === stage ? null : o))}
            onDrop={() => drop(stage)}
            className={cn("flex w-[270px] shrink-0 flex-col rounded-lg border border-border bg-muted/50 transition-colors", over === stage && "border-primary/40 bg-primary-soft/60")}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", DOT[LEAD_STAGE_VARIANT[stage]])} />
                <span className="text-[13px] font-semibold">{stage}</span>
                <span className="rounded bg-card px-1.5 text-[11px] font-medium text-muted-foreground tabular">{items.length}</span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground tabular">{formatCompactCurrency(total)}</span>
            </div>
            <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
              {items.map((l) => {
                const due = daysUntil(l.nextActionDate);
                return (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn("group rounded-lg border border-border bg-card p-3 transition-colors hover:border-zinc-300", dragId === l.id && "opacity-50")}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 size-3.5 shrink-0 cursor-grab text-slate-300 group-hover:text-slate-400" />
                      <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(l.id)}>
                        <div className="truncate text-[13px] font-semibold hover:text-primary">{l.company}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {l.contactName} · {l.organizationType}
                        </div>
                      </button>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600">{l.fundingNeed}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-sm font-semibold tabular">{formatCompactCurrency(l.estimatedValue)}</span>
                      <MemberAvatar id={l.ownerId} size="xs" />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
                      <span className={cn("inline-flex min-w-0 items-center gap-1 text-[11px]", due < 0 ? "text-red-600" : due <= 1 ? "text-amber-600" : "text-muted-foreground")}>
                        <CalendarClock className="size-3 shrink-0" />
                        <span className="truncate">
                          {formatShortDate(l.nextActionDate)} · {l.nextAction}
                        </span>
                      </span>
                    </div>
                    <select
                      aria-label={`Move ${l.company} to stage`}
                      value={l.stage}
                      onChange={(e) => {
                        moveLeadStage(l.id, e.target.value as LeadStage);
                        toast.success(`${l.company} moved to ${e.target.value}`);
                      }}
                      className="mt-2 h-7 w-full rounded border border-border bg-muted/50 px-1.5 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                      {LEAD_STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
              {!items.length && <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border py-6 text-[11px] text-muted-foreground">Drop leads here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
