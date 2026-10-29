"use client";
import Link from "next/link";
import { toast } from "sonner";
import type { AppData } from "@/lib/types";
import { toggleTaskComplete } from "@/lib/data-service";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/shared/status-badge";
import { cn, daysLeftLabel, daysUntil } from "@/lib/utils";

export function MyTasks({ data, limit = 6 }: { data: AppData; limit?: number }) {
  const uid = data.settings.currentUserId;
  const tasks = data.tasks
    .filter((t) => t.ownerId === uid && (t.status !== "Done" || (t.completedAt && daysUntil(t.completedAt) === 0)))
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, limit);
  if (!tasks.length) return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No open tasks assigned to you.</p>;
  return (
    <ul className="divide-y divide-border">
      {tasks.map((t) => {
        const done = t.status === "Done";
        const client = data.clients.find((c) => c.id === t.clientId);
        const d = daysUntil(t.dueDate);
        return (
          <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
            <Checkbox
              checked={done}
              aria-label={`Complete ${t.title}`}
              onCheckedChange={() => {
                toggleTaskComplete(t.id);
                if (!done) toast.success("Task completed", { description: t.title });
              }}
            />
            <div className="min-w-0 flex-1">
              <div className={cn("truncate text-[13px] font-medium", done && "text-muted-foreground line-through")}>{t.title}</div>
              {client && (
                <Link href={t.applicationId ? `/applications/${t.applicationId}` : `/clients/${client.id}`} className="truncate text-xs text-muted-foreground hover:text-primary">
                  {client.name}
                </Link>
              )}
            </div>
            <PriorityBadge priority={t.priority} />
            <span className={cn("w-20 shrink-0 text-right text-[11px] font-medium", done ? "text-emerald-600" : d < 0 ? "text-red-600" : d <= 1 ? "text-amber-600" : "text-muted-foreground")}>
              {done ? "Done" : daysLeftLabel(t.dueDate)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
