"use client";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/components/shared/avatar";
import { InfoRow } from "@/components/shared/info-row";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { ReviewStatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toggleChecklist, updateApplication } from "@/lib/data-service";
import { budgetTotals, complianceSummary } from "@/lib/selectors";
import { CHECKLIST_ITEMS } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ReviewsTab } from "./reviews-tab";
import type { AppContext } from "./use-application";

export function OverviewTab({ ctx, onNavigate }: { ctx: AppContext; onNavigate: (tab: string) => void }) {
  const { app, opp, data } = ctx;
  const totals = budgetTotals(app.budget);
  const cs = complianceSummary(app);
  const done = CHECKLIST_ITEMS.filter((c) => app.checklist[c.key]).length;
  const [editingNext, setEditingNext] = useState(false);
  const [next, setNext] = useState(app.nextAction);
  const [notes, setNotes] = useState(app.notes);

  const activities = data.activities.filter((a) => a.applicationId === app.id);

  const missing: { text: string; tab: string }[] = [];
  if (cs.missing) missing.push({ text: `${cs.missing} compliance requirement${cs.missing > 1 ? "s" : ""} missing`, tab: "documents" });
  const notStarted = app.sections.filter((s) => s.status === "Not Started").length;
  if (notStarted) missing.push({ text: `${notStarted} narrative section${notStarted > 1 ? "s" : ""} not started`, tab: "writing" });
  if (!app.checklist.budgetCompleted) missing.push({ text: "Budget not marked complete", tab: "budget" });

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        {missing.length > 0 && !["Submitted", "Awarded", "Not Awarded"].includes(app.status) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertTriangle className="size-4" /> Items needing attention
            </div>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {missing.map((m) => (
                <li key={m.text}>
                  <button onClick={() => onNavigate(m.tab)} className="inline-flex items-center gap-1 text-[13px] text-amber-900 hover:underline">
                    {m.text} <ArrowRight className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Progress checklist</CardTitle>
              <CardDescription>{done} of {CHECKLIST_ITEMS.length} preparation milestones complete</CardDescription>
            </div>
            <span className="text-sm font-semibold tabular">{Math.round((done / CHECKLIST_ITEMS.length) * 100)}%</span>
          </CardHeader>
          <CardContent>
            <Progress value={(done / CHECKLIST_ITEMS.length) * 100} className="mb-4" />
            <ul className="grid gap-1 sm:grid-cols-2">
              {CHECKLIST_ITEMS.map((c) => (
                <li key={c.key}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted/60">
                    <Checkbox checked={app.checklist[c.key]} onCheckedChange={() => toggleChecklist(app.id, c.key)} />
                    <span className={cn("text-sm", app.checklist[c.key] ? "text-muted-foreground line-through decoration-slate-300" : "text-foreground")}>{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next action</CardTitle>
            {!editingNext && (
              <Button variant="ghost" size="xs" onClick={() => setEditingNext(true)}>
                <Pencil /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingNext ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateApplication(app.id, { nextAction: next });
                  setEditingNext(false);
                  toast.success("Next action updated");
                }}
              >
                <Input autoFocus value={next} onChange={(e) => setNext(e.target.value)} />
                <Button type="submit">Save</Button>
                <Button variant="ghost" onClick={() => { setNext(app.nextAction); setEditingNext(false); }}>Cancel</Button>
              </form>
            ) : (
              <p className="text-sm">{app.nextAction || "—"}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Important notes</CardTitle>
              <CardDescription>Shared with the internal team</CardDescription>
            </div>
            <Button size="xs" variant="outline" disabled={notes === app.notes} onClick={() => { updateApplication(app.id, { notes }); toast.success("Notes saved"); }}>
              Save notes
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context, decisions, and client commitments…" />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <InfoRow label="Award range">{opp ? `${formatCurrency(opp.awardFloor)} – ${formatCurrency(opp.awardCeiling)}` : "—"}</InfoRow>
            <InfoRow label="Match / cost share">{totals.clientMatch ? `${formatCurrency(totals.clientMatch)} (${app.budget.matchPct}%)` : "Not required"}</InfoRow>
            <InfoRow label="Total project cost">{formatCurrency(totals.totalProjectCost)}</InfoRow>
            <InfoRow label="Risk"><RiskBadge risk={app.risk} /></InfoRow>
            <InfoRow label="Lead writer"><MemberAvatar id={app.writerId} showName size="xs" /></InfoRow>
            <InfoRow label="Grants manager"><MemberAvatar id={app.managerId} showName size="xs" /></InfoRow>
          </CardContent>
        </Card>
        <ReviewsCard ctx={ctx} />
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <ActivityFeed items={activities} limit={8} showContext={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewsCard({ ctx }: { ctx: AppContext }) {
  const [open, setOpen] = useState(false);
  const reviews = [...ctx.reviews].sort((a, b) => a.type.localeCompare(b.type));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
        {reviews.length > 0 && (
          <Button variant="ghost" size="xs" onClick={() => setOpen(true)}>
            Open reviews
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {reviews.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No review cycles configured.</p>
        ) : (
          <ul className="space-y-2.5">
            {reviews.map((r) => {
              const openComments = r.comments.filter((c) => !c.resolved).length;
              return (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm">{r.type}</div>
                    <div className="text-[13px] text-muted-foreground">
                      Due {formatDate(r.dueDate)}
                      {openComments > 0 && ` · ${openComments} open comment${openComments > 1 ? "s" : ""}`}
                    </div>
                  </div>
                  <ReviewStatusBadge status={r.status} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Reviews</DialogTitle>
            <DialogDescription>Comments and approvals for each review cycle.</DialogDescription>
          </DialogHeader>
          <ReviewsTab ctx={ctx} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
