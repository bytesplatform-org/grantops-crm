"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Columns3, List, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, SegmentedList, SegmentedTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteLead, useAppData } from "@/lib/data-service";
import { LEAD_STAGES, type Lead } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";
import { LeadBoard } from "./lead-board";
import { LeadTable } from "./lead-table";
import { LeadDrawer } from "./lead-drawer";
import { LeadFormDialog } from "./lead-form-dialog";
import { ORG_TYPES } from "./constants";

export function LeadsView() {
  const data = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openId = params.get("lead");
  const [view, setView] = useState<"pipeline" | "table">("table");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [orgType, setOrgType] = useState("all");
  const [owner, setOwner] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | undefined>();
  const [deleting, setDeleting] = useState<Lead | undefined>();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.leads.filter(
      (l) =>
        (!term || [l.company, l.contactName, l.email, l.fundingNeed, l.location].some((s) => s.toLowerCase().includes(term))) &&
        (stage === "all" || l.stage === stage) &&
        (orgType === "all" || l.organizationType === orgType) &&
        (owner === "all" || l.ownerId === owner),
    );
  }, [data.leads, q, stage, orgType, owner]);

  const stats = useMemo(() => {
    const open = data.leads.filter((l) => l.stage !== "Won" && l.stage !== "Lost");
    const won = data.leads.filter((l) => l.stage === "Won").length;
    const lost = data.leads.filter((l) => l.stage === "Lost").length;
    return {
      open: open.length,
      pipeline: open.reduce((s, l) => s + l.estimatedValue, 0),
      engagement: open.reduce((s, l) => s + l.proposalValue, 0),
      winRate: won + lost ? Math.round((won / (won + lost)) * 100) : 0,
    };
  }, [data.leads]);

  const setLeadParam = (id?: string) => {
    const p = new URLSearchParams(params.toString());
    if (id) p.set("lead", id);
    else p.delete("lead");
    router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false });
  };

  const openLead = data.leads.find((l) => l.id === openId);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Prospective funding clients."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus /> Add Lead
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard highlight label="Open leads" value={stats.open} />
        <StatCard label="Pipeline value" value={formatCompactCurrency(stats.pipeline)} />
        <StatCard label="Proposed engagements" value={formatCompactCurrency(stats.engagement)} />
        <StatCard label="Win rate" value={`${stats.winRate}%`} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads…" className="pl-8" aria-label="Search leads" />
        </div>
        <Select value={stage} onChange={(e) => setStage(e.target.value)} className="w-44" aria-label="Filter by stage">
          <option value="all">All stages</option>
          {LEAD_STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={orgType} onChange={(e) => setOrgType(e.target.value)} className="w-48" aria-label="Filter by organization type">
          <option value="all">All org types</option>
          {ORG_TYPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-40" aria-label="Filter by owner">
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
          onEdit={(l) => {
            setEditing(l);
            setFormOpen(true);
          }}
          onDelete={setDeleting}
        />
      )}

      <LeadDrawer
        lead={openLead}
        onClose={() => setLeadParam()}
        onEdit={(l) => {
          setEditing(l);
          setFormOpen(true);
        }}
      />
      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} lead={editing} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(undefined)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete lead?</DialogTitle>
            <DialogDescription>{deleting?.company} and its notes and tasks will be removed from the pipeline. This cannot be undone.</DialogDescription>
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
                  toast.success("Lead deleted", { description: deleting.company });
                }
                setDeleting(undefined);
              }}
            >
              Delete lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
