"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Columns3, Inbox as InboxIcon, List, Loader2, MailPlus, RefreshCw, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, SegmentedList, SegmentedTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteLead, discoverLeads, useAppData } from "@/lib/data-service";
import { LEAD_STAGES, type Lead, type LeadSourceKind } from "@/lib/types";
import { daysUntil, formatCompactCurrency, relativeTime } from "@/lib/utils";
import { LeadBoard } from "./lead-board";
import { LeadTable } from "./lead-table";
import { LeadDrawer } from "./lead-drawer";
import { LeadFormDialog } from "./lead-form-dialog";
import { ORG_TYPES } from "./constants";
import { Inbox } from "./inbox/inbox";
import { ComposeDialog } from "./inbox/compose-dialog";
import { unreadCount } from "./inbox/threads";

const SOURCE_KINDS: LeadSourceKind[] = ["Federal award recipients", "Nonprofit registry", "State grant list", "Organization website", "Local news"];

export function LeadsView() {
  const data = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") === "inbox" ? "inbox" : "leads";
  const openId = params.get("lead");
  const threadId = params.get("thread") ?? undefined;
  const [view, setView] = useState<"pipeline" | "table">("table");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [orgType, setOrgType] = useState("all");
  const [source, setSource] = useState("all");
  const [owner, setOwner] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | undefined>();
  const [deleting, setDeleting] = useState<Lead | undefined>();
  const [syncing, setSyncing] = useState(false);
  const [compose, setCompose] = useState<{ open: boolean; leadId?: string }>({ open: false });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.leads.filter(
      (l) =>
        (!term || [l.company, l.contactName, l.email, l.fundingNeed, l.location, l.source].some((s) => s.toLowerCase().includes(term))) &&
        (stage === "all" || l.stage === stage) &&
        (orgType === "all" || l.organizationType === orgType) &&
        (source === "all" || l.sourceKind === source) &&
        (owner === "all" || l.ownerId === owner),
    );
  }, [data.leads, q, stage, orgType, source, owner]);

  const stats = useMemo(() => {
    const open = data.leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
    const emailed = new Set(data.emails.filter((e) => e.direction === "outbound").map((e) => e.leadId));
    const replied = new Set(data.emails.filter((e) => e.direction === "inbound").map((e) => e.leadId));
    return {
      open: open.length,
      newThisWeek: data.leads.filter((l) => daysUntil(l.discoveredAt) >= -7).length,
      replyRate: emailed.size ? Math.round(([...emailed].filter((id) => replied.has(id)).length / emailed.size) * 100) : 0,
      pipeline: open.reduce((s, l) => s + l.estimatedValue, 0),
    };
  }, [data.leads, data.emails]);

  const unread = unreadCount(data);

  const setParams = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false });
  };
  const setLeadParam = (id?: string) => setParams({ lead: id });
  const openCompose = (leadId?: string) => setCompose({ open: true, leadId });

  async function sync() {
    setSyncing(true);
    try {
      const added = await discoverLeads();
      if (added.length) toast.success(`${added.length} new lead${added.length === 1 ? "" : "s"} discovered`, { description: added.map((l) => l.company).join(", ") });
      else toast("No new leads found", { description: "Every prospect from the current sources is already in your list." });
    } finally {
      setSyncing(false);
    }
  }

  const openLead = data.leads.find((l) => l.id === openId);

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`Prospects discovered from public sources · last synced ${relativeTime(data.leadDiscovery.lastRunAt)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => void sync()} disabled={syncing}>
              {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />} {syncing ? "Searching…" : "Sync now"}
            </Button>
            <Button onClick={() => openCompose()}>
              <MailPlus /> New email
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v === "inbox" ? "inbox" : undefined, thread: undefined })} className="mb-6">
        <TabsList>
          <TabsTrigger value="leads">
            <Users /> Leads
          </TabsTrigger>
          <TabsTrigger value="inbox">
            <InboxIcon /> Inbox
            {unread > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold leading-4 text-zinc-900 tabular">{unread}</span>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "inbox" ? (
        <Inbox threadId={threadId} onSelectThread={(id) => setParams({ thread: id })} onOpenLead={setLeadParam} onCompose={() => openCompose()} />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard highlight label="Open leads" value={stats.open} />
            <StatCard label="Discovered this week" value={stats.newThisWeek} />
            <StatCard label="Reply rate" value={`${stats.replyRate}%`} hint="Of leads you've emailed" />
            <StatCard label="Pipeline value" value={formatCompactCurrency(stats.pipeline)} />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads…" className="pl-8" aria-label="Search leads" />
            </div>
            <Select value={stage} onValueChange={setStage} className="w-44" aria-label="Filter by stage">
              <option value="all">All stages</option>
              {LEAD_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Select value={source} onValueChange={setSource} className="w-48" aria-label="Filter by source">
              <option value="all">All sources</option>
              {SOURCE_KINDS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Select value={orgType} onValueChange={setOrgType} className="w-48" aria-label="Filter by organization type">
              <option value="all">All org types</option>
              {ORG_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Select value={owner} onValueChange={setOwner} className="w-40" aria-label="Filter by owner">
              <option value="all">All owners</option>
              {data.team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <div className="ml-auto">
              <Tabs value={view} onValueChange={(v) => setView(v as "pipeline" | "table")}>
                <SegmentedList>
                  <SegmentedTrigger value="table">
                    <List /> Table
                  </SegmentedTrigger>
                  <SegmentedTrigger value="pipeline">
                    <Columns3 /> Board
                  </SegmentedTrigger>
                </SegmentedList>
              </Tabs>
            </div>
          </div>

          {view === "pipeline" ? (
            <LeadBoard leads={filtered} onOpen={setLeadParam} />
          ) : (
            <LeadTable
              leads={filtered}
              onOpen={setLeadParam}
              onEmail={openCompose}
              onEdit={(l) => {
                setEditing(l);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
          )}

          <p className="mt-4 text-[12px] text-muted-foreground">Lead discovery and email delivery are simulated in this demo; all organizations and contacts are fictional.</p>
        </>
      )}

      <LeadDrawer
        lead={openLead}
        onClose={() => setLeadParam()}
        onEmail={(id) => openCompose(id)}
        onOpenThread={(id) => setParams({ lead: undefined, tab: "inbox", thread: id })}
        onEdit={(l) => {
          setEditing(l);
          setFormOpen(true);
        }}
      />
      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editing} />
      <ComposeDialog
        open={compose.open}
        leadId={compose.leadId}
        onOpenChange={(o) => setCompose((c) => ({ ...c, open: o }))}
        onSent={(id) => {
          if (tab === "inbox") setParams({ thread: id });
        }}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove lead?</DialogTitle>
            <DialogDescription>{deleting?.company}, its notes, tasks and email history will be removed. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleting) {
                  deleteLead(deleting.id);
                  if (openId === deleting.id) setLeadParam();
                  toast.success("Lead removed", { description: deleting.company });
                }
                setDeleting(undefined);
              }}
            >
              Remove lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
