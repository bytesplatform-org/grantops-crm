"use client";
import { useRouter } from "next/navigation";
import { Award, Bell, CalendarClock, CheckCheck, FileUp, GitCompareArrows, ListChecks, MessageSquare, Send, X, Mail } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { dismissNotification, markAllNotificationsRead, markNotificationRead, useAppData } from "@/lib/data-service";
import type { NotificationType } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { useState, type ComponentType } from "react";

const ICONS: Record<NotificationType, { icon: ComponentType<{ className?: string }>; cls: string }> = {
  match: { icon: GitCompareArrows, cls: "bg-blue-50 text-blue-600" },
  document: { icon: FileUp, cls: "bg-teal-50 text-teal-600" },
  deadline: { icon: CalendarClock, cls: "bg-amber-50 text-amber-600" },
  review: { icon: MessageSquare, cls: "bg-violet-50 text-violet-600" },
  submission: { icon: Send, cls: "bg-slate-100 text-slate-700" },
  task: { icon: ListChecks, cls: "bg-sky-50 text-sky-600" },
  award: { icon: Award, cls: "bg-emerald-50 text-emerald-600" },
  email: { icon: Mail, cls: "bg-brand/30 text-zinc-800" },
};

export function NotificationsMenu() {
  const data = useAppData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const unread = data.notifications.filter((n) => !n.read).length;
  const list = data.notifications.filter((n) => filter === "all" || !n.read);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex size-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-muted" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">{unread} unread</div>
          </div>
          <Button variant="ghost" size="xs" onClick={() => markAllNotificationsRead()} disabled={!unread}>
            <CheckCheck /> Mark all read
          </Button>
        </div>
        <div className="flex gap-1 border-b border-border px-3 py-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("rounded px-2 py-0.5 text-xs font-medium capitalize", filter === f ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="max-h-[420px] overflow-y-auto scrollbar-thin">
          {list.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</li>}
          {list.map((n) => {
            const I = ICONS[n.type];
            return (
              <li key={n.id} className={cn("group relative flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50", !n.read && "bg-primary-soft/40")}>
                <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", I.cls)}>
                  <I.icon className="size-3.5" />
                </span>
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    router.push(n.href);
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn("truncate text-[13px]", n.read ? "font-medium text-slate-700" : "font-semibold")}>{n.title}</span>
                    {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{relativeTime(n.createdAt)}</div>
                </button>
                <div className="absolute right-2 top-2 hidden gap-0.5 group-hover:flex">
                  {!n.read && (
                    <button className="rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground" title="Mark as read" onClick={() => markNotificationRead(n.id)}>
                      <CheckCheck className="size-3.5" />
                    </button>
                  )}
                  <button className="rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground" title="Dismiss" onClick={() => dismissNotification(n.id)}>
                    <X className="size-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
