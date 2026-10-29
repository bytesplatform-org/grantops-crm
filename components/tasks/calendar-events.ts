import type { AppData } from "@/lib/types";

export type EventKind = "grant" | "internal" | "documents" | "review" | "task";

export interface CalendarEvent {
  id: string;
  kind: EventKind;
  date: Date;
  title: string;
  subtitle: string;
  href: string;
  done?: boolean;
}

export const EVENT_STYLE: Record<EventKind, { label: string; dot: string; chip: string }> = {
  grant: { label: "Grant deadline", dot: "bg-red-500", chip: "bg-red-50 text-red-700 border-red-200" },
  internal: { label: "Internal deadline", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-800 border-amber-200" },
  documents: { label: "Client documents due", dot: "bg-teal-500", chip: "bg-teal-50 text-teal-700 border-teal-200" },
  review: { label: "Review due", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 border-violet-200" },
  task: { label: "Task", dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700 border-blue-200" },
};

export function buildEvents(data: AppData): CalendarEvent[] {
  const title = (appId?: string) => {
    const a = data.applications.find((x) => x.id === appId);
    return data.opportunities.find((o) => o.id === a?.opportunityId)?.title ?? "Application";
  };
  const clientOf = (id?: string) => data.clients.find((c) => c.id === id)?.name ?? "";
  const out: CalendarEvent[] = [];
  const closed = new Set(["Submitted", "Awarded", "Not Awarded", "Withdrawn"]);
  for (const a of data.applications) {
    if (closed.has(a.status)) continue;
    out.push({ id: `g-${a.id}`, kind: "grant", date: new Date(a.deadline), title: title(a.id), subtitle: clientOf(a.clientId), href: `/applications/${a.id}` });
    out.push({ id: `i-${a.id}`, kind: "internal", date: new Date(a.internalDeadline), title: `Internal draft: ${title(a.id)}`, subtitle: clientOf(a.clientId), href: `/applications/${a.id}` });
  }
  for (const r of data.documentRequests) {
    if (r.status === "Received") continue;
    out.push({ id: `d-${r.id}`, kind: "documents", date: new Date(r.dueDate), title: `${r.items.length} documents due from client`, subtitle: clientOf(r.clientId), href: "/documents?tab=requests" });
  }
  for (const r of data.reviews) {
    const a = data.applications.find((x) => x.id === r.applicationId);
    if (r.status === "Approved" || !a || closed.has(a.status)) continue;
    out.push({ id: `r-${r.id}`, kind: "review", date: new Date(r.dueDate), title: `${r.type}: ${title(r.applicationId)}`, subtitle: clientOf(a.clientId), href: `/applications/${r.applicationId}?tab=reviews` });
  }
  for (const t of data.tasks) {
    out.push({ id: `t-${t.id}`, kind: "task", date: new Date(t.dueDate), title: t.title, subtitle: clientOf(t.clientId), href: t.applicationId ? `/applications/${t.applicationId}` : "/tasks", done: t.status === "Done" });
  }
  return out;
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
