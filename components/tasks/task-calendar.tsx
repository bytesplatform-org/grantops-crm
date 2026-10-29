"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppData } from "@/lib/data-service";
import { cn } from "@/lib/utils";
import { EVENT_STYLE, buildEvents, dayKey, type CalendarEvent, type EventKind } from "./calendar-events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskCalendar() {
  const data = useAppData();
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);
  const [hidden, setHidden] = useState<Set<EventKind>>(new Set());

  const events = useMemo(() => buildEvents(data), [data]);
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (hidden.has(e.kind)) continue;
      const k = dayKey(e.date);
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return m;
  }, [events, hidden]);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const weeks = days[35].getMonth() !== cursor.getMonth() ? days.slice(0, 35) : days;
  const selectedEvents = byDay.get(dayKey(selected)) ?? [];
  const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <h2 className="w-40 text-base font-semibold">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
            <Button variant="outline" size="icon-sm" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronRight />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }}>
              Today
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(EVENT_STYLE) as EventKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
                className={cn("inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium", hidden.has(k) ? "opacity-40" : "bg-card")}
                aria-pressed={!hidden.has(k)}
              >
                <span className={cn("size-2 rounded-full", EVENT_STYLE[k].dot)} />
                {EVENT_STYLE[k].label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((d) => {
            const evs = byDay.get(dayKey(d)) ?? [];
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = sameDay(d, today);
            const isSel = sameDay(d, selected);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={cn(
                  "min-h-[104px] border-b border-r border-border p-1.5 text-left align-top transition-colors last:border-r-0 [&:nth-child(7n)]:border-r-0 hover:bg-muted/40",
                  !inMonth && "bg-muted/30",
                  isSel && "bg-primary-soft/60 ring-1 ring-inset ring-primary/40",
                )}
              >
                <span className={cn("mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs tabular", isToday ? "bg-primary font-semibold text-white" : inMonth ? "text-foreground" : "text-slate-400")}>
                  {d.getDate()}
                </span>
                <div className="space-y-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <div key={e.id} className={cn("truncate rounded border px-1 py-px text-[10px] font-medium", EVENT_STYLE[e.kind].chip, e.done && "line-through opacity-60")}>
                      {e.title}
                    </div>
                  ))}
                  {evs.length > 3 && <div className="px-1 text-[10px] font-medium text-muted-foreground">+{evs.length - 3} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
      <Card className="h-fit">
        <div className="border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">{selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
          <div className="text-xs text-muted-foreground">{selectedEvents.length} item{selectedEvents.length === 1 ? "" : "s"}</div>
        </div>
        <ul className="divide-y divide-border">
          {selectedEvents.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing scheduled.</li>}
          {selectedEvents.map((e) => (
            <li key={e.id}>
              <Link href={e.href} className="flex gap-3 px-5 py-3 hover:bg-muted/40">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", EVENT_STYLE[e.kind].dot)} />
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", e.done && "text-muted-foreground line-through")}>{e.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {EVENT_STYLE[e.kind].label}
                    {e.subtitle && ` · ${e.subtitle}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
