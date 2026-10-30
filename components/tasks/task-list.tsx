"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberAvatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PriorityBadge } from "@/components/shared/status-badge";
import { toggleTaskComplete, updateTask, useAppData } from "@/lib/data-service";
import type { Task, TaskStatus } from "@/lib/types";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import { Select } from "@/components/ui/select";

type Group = "Overdue" | "Today" | "This Week" | "Later" | "Completed";
const GROUPS: Group[] = ["Overdue", "Today", "This Week", "Later", "Completed"];

function groupOf(t: Task): Group {
  if (t.status === "Done") return "Completed";
  const d = daysUntil(t.dueDate);
  if (d < 0) return "Overdue";
  if (d === 0) return "Today";
  if (d <= 7) return "This Week";
  return "Later";
}

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [collapsed, setCollapsed] = useState<Set<Group>>(new Set(["Completed"]));
  const grouped = useMemo(() => {
    const m = new Map<Group, Task[]>();
    for (const t of [...tasks].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))) {
      const g = groupOf(t);
      m.set(g, [...(m.get(g) ?? []), t]);
    }
    return m;
  }, [tasks]);

  if (!tasks.length) return <EmptyState icon={ListChecks} title="No tasks match your filters" />;

  return (
    <div className="space-y-4">
      {GROUPS.filter((g) => grouped.get(g)?.length).map((g) => {
        const items = grouped.get(g)!;
        const isCollapsed = collapsed.has(g);
        return (
          <Card key={g} className="overflow-hidden">
            <button
              className="flex w-full items-center gap-2 border-b border-border bg-muted/40 px-5 py-2.5 text-left"
              onClick={() =>
                setCollapsed((s) => {
                  const n = new Set(s);
                  if (n.has(g)) n.delete(g);
                  else n.add(g);
                  return n;
                })
              }
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronRight className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              <span className={cn("text-[13px] font-semibold", g === "Overdue" && "text-red-600")}>{g}</span>
              <span className="rounded bg-card px-1.5 text-[11px] font-semibold text-muted-foreground tabular">{items.length}</span>
            </button>
            {!isCollapsed && (
              <ul className="divide-y divide-border">
                {items.map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function TaskRow({ task: t }: { task: Task }) {
  const data = useAppData();
  const app = data.applications.find((a) => a.id === t.applicationId);
  const opp = data.opportunities.find((o) => o.id === app?.opportunityId);
  const client = data.clients.find((c) => c.id === t.clientId);
  const done = t.status === "Done";
  const overdue = !done && daysUntil(t.dueDate) < 0;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 hover:bg-muted/30 md:flex-nowrap">
      <Checkbox
        checked={done}
        aria-label={`Complete ${t.title}`}
        onCheckedChange={() => {
          toggleTaskComplete(t.id);
          if (!done) toast.success("Task completed", { description: t.title });
        }}
      />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>{t.title}</div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="shrink-0 rounded bg-muted px-1.5 py-px text-[10px] font-medium">{t.type}</span>
          {app ? (
            <Link href={`/applications/${app.id}`} className="truncate hover:text-primary hover:underline">
              {opp?.title}
            </Link>
          ) : null}
          {client && (
            <>
              {app && <span className="text-slate-300">·</span>}
              <Link href={`/clients/${client.id}`} className="truncate hover:text-primary hover:underline">
                {client.name}
              </Link>
            </>
          )}
        </div>
      </div>
      <MemberAvatar id={t.ownerId} showName className="w-36 shrink-0" />
      <span className={cn("w-24 shrink-0 text-sm tabular", overdue ? "font-medium text-red-600" : "text-slate-600")}>{formatDate(t.dueDate, { month: "short", day: "numeric" })}</span>
      <span className="w-16 shrink-0">
        <PriorityBadge priority={t.priority} />
      </span>
      <Select
        aria-label="Task status"
        value={t.status}
        onValueChange={(v) => {
          const s = v as TaskStatus;
          if (s === "Done" || done) toggleTaskComplete(t.id);
          if (s !== "Done") updateTask(t.id, { status: s });
        }}
        className="h-7 w-28 shrink-0 rounded-md border border-input bg-card px-2 text-xs"
      >
        <option>To Do</option>
        <option>In Progress</option>
        <option>Done</option>
      </Select>
    </li>
  );
}
