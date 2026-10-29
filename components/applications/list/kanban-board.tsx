"use client";
import { useState } from "react";
import { APP_STATUS_COLOR } from "@/components/shared/status-badge";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";
import { cn, formatCompactCurrency } from "@/lib/utils";
import { ApplicationCard } from "./application-card";
import { changeStatus } from "./status-menu";
import type { AppRow } from "./use-application-rows";

export function KanbanBoard({ rows }: { rows: AppRow[] }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<ApplicationStatus | null>(null);

  function drop(status: ApplicationStatus, id: string) {
    const row = rows.find((r) => r.app.id === id);
    if (row) changeStatus(row.app, status);
    setDragId(null);
    setOver(null);
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin lg:-mx-8 lg:px-8">
      <div className="flex min-w-max gap-3">
        {APPLICATION_STATUSES.map((status) => {
          const col = rows.filter((r) => r.app.status === status);
          const total = col.reduce((s, r) => s + r.app.fundingRequested, 0);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (over !== status) setOver(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) drop(status, id);
              }}
              className={cn(
                "flex w-[272px] shrink-0 flex-col rounded-lg border border-transparent bg-slate-100/70 transition-colors",
                over === status && "border-primary/40 bg-primary-soft",
              )}
            >
              <div className="flex items-center justify-between px-3 pb-2 pt-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: APP_STATUS_COLOR[status] }} />
                  <span className="text-[13px] font-semibold">{status}</span>
                  <span className="rounded bg-card px-1.5 text-[11px] font-medium text-muted-foreground tabular">{col.length}</span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular">{total ? formatCompactCurrency(total) : ""}</span>
              </div>
              <div className="flex min-h-32 flex-1 flex-col gap-2 px-2 pb-2">
                {col.map((r) => (
                  <ApplicationCard key={r.app.id} row={r} dragging={dragId === r.app.id} onDragStart={() => setDragId(r.app.id)} onDragEnd={() => { setDragId(null); setOver(null); }} />
                ))}
                {col.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-slate-300/80 py-6 text-[11px] text-muted-foreground">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
