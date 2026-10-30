"use client";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Clock, FileWarning, Inbox, Mail, UserCheck, type LucideIcon } from "lucide-react";
import type { AppData } from "@/lib/types";
import { isActive } from "@/lib/selectors";
import { cn, daysUntil } from "@/lib/utils";

interface Item {
  key: string;
  icon: LucideIcon;
  tone: string;
  label: string;
  detail: string;
  href: string;
}

function appHref(id?: string, tab?: string) {
  return id ? `/applications/${id}${tab ? `?tab=${tab}` : ""}` : "/applications";
}

export function attentionItems(data: AppData): Item[] {
  const items: Item[] = [];
  const unreadReplies = data.emails.filter((e) => e.direction === "inbound" && !e.read);
  if (unreadReplies.length)
    items.push({
      key: "replies",
      icon: Inbox,
      tone: "text-lime-700 bg-lime-100",
      label: `${unreadReplies.length} unread lead repl${unreadReplies.length === 1 ? "y" : "ies"}`,
      detail: [...new Set(unreadReplies.map((e) => e.fromName))].slice(0, 2).join(", "),
      href: unreadReplies.length === 1 ? `/leads?tab=inbox&thread=${unreadReplies[0].threadId}` : "/leads?tab=inbox",
    });
  const overdueDocs = data.documents.filter((d) => d.status === "Overdue");
  if (overdueDocs.length)
    items.push({
      key: "docs",
      icon: FileWarning,
      tone: "text-red-600 bg-red-50",
      label: `${overdueDocs.length} document${overdueDocs.length === 1 ? "" : "s"} overdue`,
      detail: overdueDocs.slice(0, 2).map((d) => d.name).join(", "),
      href: appHref(overdueDocs[0].applicationId, "documents"),
    });
  const active = data.applications.filter(isActive);
  const missingLetters = active.filter((a) => a.compliance.some((c) => /Letter/i.test(c.requirement) && c.status !== "Complete"));
  if (missingLetters.length)
    items.push({
      key: "letters",
      icon: Mail,
      tone: "text-amber-600 bg-amber-50",
      label: `${missingLetters.length} application${missingLetters.length === 1 ? "" : "s"} missing letters of support`,
      detail: missingLetters
        .slice(0, 2)
        .map((a) => data.clients.find((c) => c.id === a.clientId)?.name)
        .join(", "),
      href: missingLetters.length === 1 ? `/applications/${missingLetters[0].id}?tab=documents` : "/applications",
    });
  const expiring = data.opportunities.filter((o) => {
    const d = daysUntil(o.deadline);
    return d >= 0 && d <= 2 && data.matches.some((m) => m.opportunityId === o.id && m.status !== "Dismissed" && !m.applicationId);
  });
  if (expiring.length)
    items.push({
      key: "expiring",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-50",
      label: `${expiring.length} matched opportunit${expiring.length === 1 ? "y expires" : "ies expire"} in 48 hours`,
      detail: expiring.map((o) => o.title).join(", "),
      href: `/opportunities/${expiring[0].id}`,
    });
  const approvals = data.reviews.filter((r) => {
    if (r.type !== "Client Review" || r.status === "Approved" || r.status === "Not Started") return false;
    const app = data.applications.find((a) => a.id === r.applicationId);
    return !!app && isActive(app);
  });
  if (approvals.length)
    items.push({
      key: "approvals",
      icon: UserCheck,
      tone: "text-violet-600 bg-violet-50",
      label: `${approvals.length} client approval${approvals.length === 1 ? "" : "s"} pending`,
      detail: approvals
        .slice(0, 2)
        .map((r) => data.clients.find((c) => c.id === data.applications.find((a) => a.id === r.applicationId)?.clientId)?.name)
        .join(", "),
      href: approvals.length === 1 ? `/applications/${approvals[0].applicationId}` : "/applications",
    });
  const overdueTasks = data.tasks.filter((t) => t.status !== "Done" && daysUntil(t.dueDate) < 0);
  if (overdueTasks.length)
    items.push({
      key: "tasks",
      icon: Clock,
      tone: "text-sky-600 bg-sky-50",
      label: `${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} past due`,
      detail: overdueTasks.slice(0, 2).map((t) => t.title).join(", "),
      href: appHref(overdueTasks[0].applicationId),
    });
  return items;
}

export function NeedsAttention({ data }: { data: AppData }) {
  const items = attentionItems(data);
  if (!items.length) return <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nothing needs attention right now.</p>;
  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((i) => (
        <li key={i.key}>
          <Link href={i.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", i.tone)}>
              <i.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{i.label}</div>
              <div className="truncate text-[13px] text-muted-foreground">{i.detail}</div>
            </div>
            <ChevronRight className="size-4 text-zinc-300 group-hover:text-zinc-500" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
