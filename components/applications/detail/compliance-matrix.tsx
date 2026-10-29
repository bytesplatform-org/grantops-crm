"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberAvatar } from "@/components/shared/avatar";
import { addComplianceRequirement, updateCompliance } from "@/lib/data-service";
import { complianceSummary } from "@/lib/selectors";
import type { ComplianceRequirement, ComplianceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { AppContext } from "./use-application";

const STATUSES: ComplianceStatus[] = ["Complete", "In Progress", "Needs Review", "Missing"];
const STATUS_CLS: Record<ComplianceStatus, string> = {
  Complete: "text-emerald-700 bg-emerald-50 border-emerald-200",
  "In Progress": "text-sky-700 bg-sky-50 border-sky-200",
  "Needs Review": "text-amber-700 bg-amber-50 border-amber-200",
  Missing: "text-red-700 bg-red-50 border-red-200",
};

export function ComplianceMatrix({ ctx }: { ctx: AppContext }) {
  const { app, data } = ctx;
  const [filter, setFilter] = useState<ComplianceStatus | "All">("All");
  const [adding, setAdding] = useState(false);
  const s = complianceSummary(app);
  const rows = app.compliance.filter((c) => filter === "All" || c.status === filter);
  const pct = s.total ? Math.round((s.complete / s.total) * 100) : 0;

  const chips: { label: string; value: ComplianceStatus | "All"; n: number; cls: string }[] = [
    { label: "requirements", value: "All", n: s.total, cls: "text-foreground" },
    { label: "complete", value: "Complete", n: s.complete, cls: "text-emerald-700" },
    { label: "in progress", value: "In Progress", n: s.inProgress, cls: "text-sky-700" },
    { label: "needs review", value: "Needs Review", n: s.needsReview, cls: "text-amber-700" },
    { label: "missing", value: "Missing", n: s.missing, cls: "text-red-700" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.label}
              onClick={() => setFilter(c.value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[13px] transition-colors",
                filter === c.value ? "border-primary/40 bg-primary-soft" : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className={cn("font-semibold tabular", c.cls)}>{c.n}</span> <span className="text-muted-foreground">{c.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{pct}%</span> compliant
          </span>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> Add requirement
          </Button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Requirement</TableHead>
              <TableHead>Source / NOFO Section</TableHead>
              <TableHead>Assigned Section</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.requirement}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">{r.source}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{r.assignedSection}</TableCell>
                <TableCell className="w-56">
                  <EvidenceInput key={r.evidence} req={r} appId={app.id} />
                </TableCell>
                <TableCell>
                  <MemberAvatar id={r.ownerId} showName size="xs" className="max-w-36" />
                </TableCell>
                <TableCell>
                  <select
                    aria-label="Requirement status"
                    value={r.status}
                    onChange={(e) => {
                      updateCompliance(app.id, r.id, { status: e.target.value as ComplianceStatus });
                      toast.success(`${r.requirement}: ${e.target.value}`);
                    }}
                    className={cn("h-7 rounded-md border px-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30", STATUS_CLS[r.status])}
                  >
                    {STATUSES.map((st) => (
                      <option key={st}>{st}</option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No requirements with this status.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <AddRequirementDialog open={adding} onOpenChange={setAdding} appId={app.id} team={data.team.map((t) => ({ id: t.id, name: t.name }))} />
    </div>
  );
}

function EvidenceInput({ req, appId }: { req: ComplianceRequirement; appId: string }) {
  const [v, setV] = useState(req.evidence === "—" ? "" : req.evidence);
  return (
    <input
      aria-label="Evidence"
      value={v}
      placeholder="Add evidence…"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const next = v.trim() || "—";
        if (next !== req.evidence) updateCompliance(appId, req.id, { evidence: next });
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="h-7 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] hover:border-border focus:border-ring focus:bg-card focus:outline-none"
    />
  );
}

function AddRequirementDialog({ open, onOpenChange, appId, team }: { open: boolean; onOpenChange: (o: boolean) => void; appId: string; team: { id: string; name: string }[] }) {
  const [requirement, setRequirement] = useState("");
  const [source, setSource] = useState("");
  const [section, setSection] = useState("Documents");
  const [owner, setOwner] = useState("u-maria");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add compliance requirement</DialogTitle>
          <DialogDescription>Track an additional NOFO requirement in the compliance matrix.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!requirement.trim()) return;
            addComplianceRequirement(appId, { requirement: requirement.trim(), source: source.trim() || "—", assignedSection: section, evidence: "—", ownerId: owner, status: "Missing" });
            toast.success("Requirement added");
            setRequirement("");
            setSource("");
            onOpenChange(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="req">Requirement</Label>
            <Input id="req" value={requirement} onChange={(e) => setRequirement(e.target.value)} placeholder="e.g. Data Management Plan" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="src">Source / NOFO section</Label>
              <Input id="src" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Section IV.D" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sec">Assigned section</Label>
              <Select id="sec" value={section} onChange={(e) => setSection(e.target.value)}>
                {["Documents", "Project Description", "Budget", "Federal Forms", "Evaluation Plan", "Organizational Capacity", "Eligibility"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="own">Owner</Label>
            <Select id="own" value={owner} onChange={(e) => setOwner(e.target.value)}>
              {team.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="client">Client</option>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!requirement.trim()}>Add requirement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
