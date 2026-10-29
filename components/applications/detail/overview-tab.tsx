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
import { ApplicationStatusBadge, RiskBadge } from "@/components/shared/status-badge";
import { toggleChecklist, updateApplication } from "@/lib/data-service";
import { budgetTotals, complianceSummary } from "@/lib/selectors";
import { CHECKLIST_ITEMS } from "@/lib/types";
import { cn, daysUntil, formatCurrency, formatDate } from "@/lib/utils";
import type { AppContext } from "./use-application";

export function OverviewTab({ ctx, onNavigate }: { ctx: AppContext; onNavigate: (tab: string) => void }) {
  const { app, opp, reviews } = ctx;
  const totals = budgetTotals(app.budget);
  const cs = complianceSummary(app);
  const done = CHECKLIST_ITEMS.filter((c) => app.checklist[c.key]).length;
  const [editingNext, setEditingNext] = useState(false);
  const [next, setNext] = useState(app.nextAction);
  const [notes, setNotes] = useState(app.notes);

  const timeline = [
    { label: "Application workspace created", date: app.createdAt },
    ...reviews.map((r) => ({ label: `${r.type} due`, date: r.dueDate })),
    { label: "Internal deadline", date: app.internalDeadline },
    { label: "Agency deadline", date: app.deadline },
    ...(app.submission.submittedAt ? [{ label: "Submitted", date: app.submission.submittedAt }] : []),
    ...(app.outcome ? [{ label: `Outcome: ${app.outcome.decision}`, date: app.outcome.decidedAt }] : []),
  ].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const missing: { text: string; tab: string }[] = [];
  if (cs.missing) missing.push({ text: `${cs.missing} compliance requirement${cs.missing > 1 ? "s" : ""} missing`, tab: "requirements" });
  const notStarted = app.sections.filter((s) => s.status === "Not Started").length;
  if (notStarted) missing.push({ text: `${notStarted} narrative section${notStarted > 1 ? "s" : ""} not started`, tab: "writing" });
  if (!app.checklist.budgetCompleted) missing.push({ text: "Budget not marked complete", tab: "budget" });
  const openComments = reviews.reduce((s, r) => s + r.comments.filter((c) => !c.resolved).length, 0);
  if (openComments) missing.push({ text: `${openComments} open review comment${openComments > 1 ? "s" : ""}`, tab: "reviews" });

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        {missing.length > 0 && !["Submitted", "Awarded", "Not Awarded"].includes(app.status) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
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
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border pt-0">
            <InfoRow label="Status"><ApplicationStatusBadge status={app.status} /></InfoRow>
            <InfoRow label="Funding requested">{formatCurrency(app.fundingRequested)}</InfoRow>
            <InfoRow label="Award range">{opp ? `${formatCurrency(opp.awardFloor)} – ${formatCurrency(opp.awardCeiling)}` : "—"}</InfoRow>
            <InfoRow label="Match / cost share">{totals.clientMatch ? `${formatCurrency(totals.clientMatch)} (${app.budget.matchPct}%)` : "Not required"}</InfoRow>
            <InfoRow label="Total project cost">{formatCurrency(totals.totalProjectCost)}</InfoRow>
            <InfoRow label="Risk"><RiskBadge risk={app.risk} /></InfoRow>
            <InfoRow label="Period of performance">{opp?.periodOfPerformance ?? "—"}</InfoRow>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Owners</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-0">
            <OwnerRow label="Lead writer" id={app.writerId} />
            <OwnerRow label="Grants manager" id={app.managerId} />
            <OwnerRow label="Compliance" id="u-priya" />
            <div className="text-xs text-muted-foreground">Reviewers: {[...new Set(reviews.flatMap((r) => r.reviewers))].join(", ")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <ol className="space-y-3">
              {timeline.map((t) => {
                const past = daysUntil(t.date) < 0;
                return (
                  <li key={t.label + t.date} className="flex items-center gap-3">
                    <span className={cn("size-2 shrink-0 rounded-full", past ? "bg-slate-300" : t.label === "Agency deadline" ? "bg-red-500" : "bg-primary")} />
                    <span className={cn("flex-1 text-[13px]", past && "text-muted-foreground")}>{t.label}</span>
                    <span className="text-xs text-muted-foreground tabular">{formatDate(t.date)}</span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OwnerRow({ label, id }: { label: string; id: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <MemberAvatar id={id} showName />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
