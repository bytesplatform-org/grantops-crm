"use client";
import { useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, ExternalLink, FileCheck2, Info, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoRow } from "@/components/shared/info-row";
import { markHandoffOpened, setApplicationStatus } from "@/lib/data-service";
import { memberName } from "@/lib/selectors";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { MarkSubmittedDialog, RecordOutcomeDialog, demoTrackingNumber } from "./submission-dialogs";
import type { AppContext } from "./use-application";

export function SubmissionTab({ ctx, onNavigate }: { ctx: AppContext; onNavigate: (tab: string) => void }) {
  const { app, data, reviews, analysis, opp } = ctx;
  const [submitOpen, setSubmitOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const review = (t: string) => reviews.find((r) => r.type === t);
  const checks = [
    { label: "NOFO analyzed", ok: !!analysis || app.checklist.nofoAnalyzed, href: opp ? `/opportunities/${opp.id}?tab=nofo` : undefined },
    { label: "Eligibility verified", ok: app.checklist.eligibilityVerified, tab: "overview" },
    { label: "Narrative complete", ok: app.sections.every((s) => s.status === "Complete"), tab: "writing", detail: `${app.sections.filter((s) => s.status === "Complete").length}/${app.sections.length} sections complete` },
    { label: "Budget complete", ok: app.checklist.budgetCompleted, tab: "budget" },
    { label: "Attachments complete", ok: !app.compliance.some((c) => c.assignedSection === "Documents" && c.status === "Missing"), tab: "documents" },
    { label: "Compliance review complete", ok: review("Compliance Review")?.status === "Approved", tab: "reviews" },
    { label: "Client approval complete", ok: review("Client Review")?.status === "Approved" || app.checklist.clientApprovalCompleted, tab: "reviews" },
  ];
  const remaining = checks.filter((c) => !c.ok).length;
  const ready = remaining === 0;
  const submitted = ["Submitted", "Awarded", "Not Awarded"].includes(app.status);

  const openSubmit = () => {
    setTracking(demoTrackingNumber());
    setSubmitOpen(true);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>Preparation Complete</CardTitle>
            <CardDescription>Final pre-submission checks before the Grants.gov handoff</CardDescription>
          </div>
          <span className="text-sm font-semibold tabular">{checks.length - remaining}/{checks.length}</span>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-3 px-4 py-3">
                {c.ok ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <XCircle className="size-5 shrink-0 text-red-500" />}
                <div className="min-w-0 flex-1">
                  <div className={cn("text-sm font-medium", !c.ok && "text-foreground")}>{c.label}</div>
                  {c.detail && <div className="text-xs text-muted-foreground">{c.detail}</div>}
                </div>
                {!c.ok &&
                  (c.href ? (
                    <Button size="xs" variant="outline" asChild><Link href={c.href}>Resolve</Link></Button>
                  ) : (
                    <Button size="xs" variant="outline" onClick={() => c.tab && onNavigate(c.tab)}>Resolve</Button>
                  ))}
              </li>
            ))}
          </ul>
          <div className={cn("mt-5 rounded-xl border p-6 text-center", submitted ? "border-slate-300 bg-slate-50" : ready ? "border-emerald-300 bg-emerald-50" : "border-amber-200 bg-amber-50/60")}>
            {submitted ? (
              <>
                <FileCheck2 className="mx-auto size-8 text-slate-700" />
                <div className="mt-2 text-lg font-bold tracking-wide text-slate-800">SUBMITTED</div>
                <div className="text-sm text-muted-foreground">Submission recorded {formatDate(app.submission.submittedAt)}</div>
              </>
            ) : ready ? (
              <>
                <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
                <div className="mt-2 text-xl font-bold tracking-wide text-emerald-800">READY TO SUBMIT</div>
                <div className="text-sm text-emerald-800/80">All preparation checks passed. Hand off to the AOR for submission.</div>
                {app.status !== "Ready to Submit" && (
                  <Button className="mt-4" variant="success" onClick={() => { setApplicationStatus(app.id, "Ready to Submit"); toast.success("Marked Ready to Submit"); }}>
                    Mark Ready to Submit
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-amber-800">Preparation in progress — {remaining} item{remaining > 1 ? "s" : ""} remaining</div>
                <div className="mt-1 text-sm text-amber-800/80">Resolve the open items above before the submission handoff.</div>
                {app.status !== "Ready to Submit" && (
                  <Button className="mt-4" variant="outline" onClick={() => { setApplicationStatus(app.id, "Ready to Submit"); toast.success("Marked Ready to Submit"); }}>
                    Mark Ready to Submit anyway
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Submission Handoff</CardTitle>
              <CardDescription>Grants.gov Workspace</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-[13px] text-sky-900">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>Official submission occurs through Grants.gov Workspace. GrantOS tracks preparation and handoff — it does not submit applications to the federal government.</p>
            </div>
            <Button
              className="w-full"
              variant={submitted ? "outline" : "default"}
              onClick={() => {
                window.open("https://www.grants.gov/", "_blank", "noopener");
                markHandoffOpened(app.id);
                toast("Grants.gov opened in a new tab", { description: "Return here to record the submission." });
              }}
            >
              <ExternalLink /> Open Grants.gov Workspace
            </Button>
            {app.submission.handoffOpenedAt && <p className="text-xs text-muted-foreground">Handoff opened {formatDateTime(app.submission.handoffOpenedAt)}</p>}
            {!submitted && (
              <Button className="w-full" variant="outline" onClick={openSubmit}>
                <Send /> Mark as Submitted
              </Button>
            )}
          </CardContent>
        </Card>
        {submitted && (
          <Card>
            <CardHeader><CardTitle>Submission record</CardTitle></CardHeader>
            <CardContent className="divide-y divide-border pt-0">
              <InfoRow label="Submitted">{formatDate(app.submission.submittedAt)}</InfoRow>
              <InfoRow label="Tracking / reference"><span className="font-mono text-xs">{app.submission.trackingNumber}</span></InfoRow>
              <InfoRow label="Recorded by">{memberName(data, app.submission.submittedBy)}</InfoRow>
              <InfoRow label="Requested">{formatCurrency(app.fundingRequested)}</InfoRow>
            </CardContent>
            {app.status === "Submitted" && (
              <div className="px-5 pb-5">
                <Button className="w-full" onClick={() => setOutcomeOpen(true)}>
                  <Award /> Record Outcome
                </Button>
              </div>
            )}
          </Card>
        )}
        {app.outcome && (
          <Card className={cn(app.outcome.decision === "Awarded" ? "border-emerald-200" : "border-red-200")}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <span className={cn("flex size-10 items-center justify-center rounded-full", app.outcome.decision === "Awarded" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                  {app.outcome.decision === "Awarded" ? <Award className="size-5" /> : <XCircle className="size-5" />}
                </span>
                <div>
                  <div className="text-sm font-semibold">{app.outcome.decision}</div>
                  <div className="text-xs text-muted-foreground">Decision {formatDate(app.outcome.decidedAt)}</div>
                </div>
              </div>
              {app.outcome.decision === "Awarded" && <div className="mt-4 text-2xl font-semibold tracking-tight text-emerald-700 tabular">{formatCurrency(app.outcome.amountAwarded)}</div>}
              {app.outcome.notes && <p className="mt-2 text-[13px] text-muted-foreground">{app.outcome.notes}</p>}
            </CardContent>
          </Card>
        )}
      </div>
      {submitOpen && <MarkSubmittedDialog appId={app.id} open={submitOpen} onOpenChange={setSubmitOpen} initialTracking={tracking} />}
      {outcomeOpen && <RecordOutcomeDialog appId={app.id} requested={app.fundingRequested} open={outcomeOpen} onOpenChange={setOutcomeOpen} />}
    </div>
  );
}
