"use client";
import Link from "next/link";
import { CheckCircle2, Clock, Inbox, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { markRequestItemReceived, sendDocumentRequest, useAppData } from "@/lib/data-service";
import type { DocumentRequest, RequestItemStatus } from "@/lib/types";
import { cn, daysUntil, formatDate, formatDateTime } from "@/lib/utils";

const ITEM_VARIANT: Record<RequestItemStatus, NonNullable<BadgeProps["variant"]>> = { Requested: "secondary", Received: "success", Overdue: "danger" };
const REQ_VARIANT: Record<DocumentRequest["status"], NonNullable<BadgeProps["variant"]>> = {
  Draft: "outline",
  Sent: "info",
  "Partially Received": "warning",
  Received: "success",
  Overdue: "danger",
};

export function effectiveItemStatus(r: DocumentRequest, s: RequestItemStatus): RequestItemStatus {
  if (s === "Received") return s;
  return r.status !== "Draft" && daysUntil(r.dueDate) < 0 ? "Overdue" : s;
}

export function RequestsList({ requests }: { requests: DocumentRequest[] }) {
  const data = useAppData();
  if (!requests.length) return <EmptyState icon={Inbox} title="No document requests" description="Use Request Documents to ask a client for missing items." />;
  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const client = data.clients.find((c) => c.id === r.clientId);
        const app = data.applications.find((a) => a.id === r.applicationId);
        const opp = data.opportunities.find((o) => o.id === app?.opportunityId);
        const contact = data.contacts.find((c) => c.id === r.contactId);
        const statuses = r.items.map((i) => effectiveItemStatus(r, i.status));
        const received = statuses.filter((s) => s === "Received").length;
        const overdue = r.status !== "Draft" && r.status !== "Received" && daysUntil(r.dueDate) < 0;
        const shownStatus = overdue ? "Overdue" : r.status;
        return (
          <Card key={r.id} className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="font-medium">{client?.name}</span>
                  <Badge variant={REQ_VARIANT[shownStatus]} dot>{shownStatus}</Badge>
                </div>
                <Link href={`/applications/${r.applicationId}?tab=documents`} className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-primary hover:underline">
                  {opp?.title}
                </Link>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>To: <span className="font-medium text-foreground">{contact?.name ?? "—"}</span></span>
                <span>Sent: <span className="text-foreground">{r.sentAt ? formatDateTime(r.sentAt) : "Not sent"}</span></span>
                <span className={cn(overdue && "font-medium text-red-600")}>
                  <Clock className="mr-1 inline size-3.5" />Due {formatDate(r.dueDate)}
                </span>
                {r.status === "Draft" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      sendDocumentRequest(r.id);
                      toast.success(`Request sent to ${contact?.name ?? client?.name}`, { description: "Demo send — no email delivered." });
                    }}
                  >
                    <Send /> Send Request
                  </Button>
                )}
              </div>
            </div>
            <ul className="divide-y divide-border">
              {r.items.map((it, idx) => {
                const st = statuses[idx];
                return (
                  <li key={it.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="flex-1">{it.name}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">{it.category}</span>
                    <Badge variant={ITEM_VARIANT[st]} dot>{st}</Badge>
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={st === "Received" || r.status === "Draft"}
                      onClick={() => {
                        markRequestItemReceived(r.id, it.id);
                        toast.success("Marked as received", { description: it.name });
                      }}
                    >
                      <CheckCircle2 /> Mark received
                    </Button>
                  </li>
                );
              })}
            </ul>
            <div className="bg-muted/40 px-5 py-2 text-xs text-muted-foreground">
              {received} of {r.items.length} received
            </div>
          </Card>
        );
      })}
    </div>
  );
}
