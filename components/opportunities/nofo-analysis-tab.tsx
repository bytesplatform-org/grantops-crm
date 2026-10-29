"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Check, CheckCircle2, Circle, FileSearch, Loader2, RefreshCw, ScanText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { InfoGrid } from "@/components/shared/info-row";
import { runNofoAnalysis, useAppData } from "@/lib/data-service";
import type { Opportunity } from "@/lib/types";
import { cn, daysUntil, formatDate, formatDateTime } from "@/lib/utils";

const STEPS = ["Parsing NOFO sections", "Extracting eligibility requirements", "Identifying required attachments", "Summarizing evaluation criteria", "Compiling key dates and risks"];

function AnalysisProgress() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <Card className="mx-auto max-w-lg p-6">
      <div className="flex items-center gap-3">
        <Loader2 className="size-5 animate-spin text-primary" />
        <div>
          <div className="text-sm font-semibold">Analyzing funding announcement…</div>
          <div className="text-xs text-muted-foreground">Extracting structured requirements from the NOFO</div>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {STEPS.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2.5 text-sm transition-colors", i <= step ? "text-foreground" : "text-muted-foreground/60")}>
            {i < step ? <CheckCircle2 className="size-4 text-emerald-600" /> : i === step ? <Loader2 className="size-4 animate-spin text-primary" /> : <Circle className="size-4" />}
            {s}…
          </li>
        ))}
      </ul>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-200/70">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
    </Card>
  );
}

function ListCard({ title, items, icon = "check" }: { title: string; items: string[]; icon?: "check" | "dot" | "warn" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              {icon === "check" && <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />}
              {icon === "warn" && <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />}
              {icon === "dot" && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" />}
              {i}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function NofoAnalysisTab({ opp }: { opp: Opportunity }) {
  const data = useAppData();
  const analysis = data.nofoAnalyses[opp.id];
  const [running, setRunning] = useState(false);
  const analyst = data.team.find((t) => t.id === analysis?.analyzedBy);
  const maxPoints = Math.max(...(analysis?.evaluationCriteria.map((c) => c.points) ?? [1]));

  const run = async () => {
    setRunning(true);
    const a = await runNofoAnalysis(opp.id);
    setRunning(false);
    if (a) toast.success("NOFO analysis complete", { description: `${a.requiredAttachments.length} required attachments · ${a.evaluationCriteria.length} evaluation criteria identified` });
  };

  if (running) return <AnalysisProgress />;
  if (!analysis)
    return (
      <EmptyState
        icon={FileSearch}
        title="This NOFO hasn't been analyzed yet"
        description="Run an analysis to extract eligibility, required attachments, evaluation criteria, key dates and risks into a structured summary."
        action={
          <Button onClick={run}>
            <ScanText /> Run Analysis
          </Button>
        }
        className="py-16"
      />
    );

  return (
    <div className="space-y-4">
      <Card className="border-blue-200/80">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft text-primary">
              <ScanText className="size-3.5" />
            </span>
            <div>
              <CardTitle>AI NOFO Summary</CardTitle>
              <CardDescription>
                Analyzed {formatDateTime(analysis.analyzedAt)}
                {analyst ? ` · ${analyst.name}` : ""} · Generated summary — verify against the official NOFO
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={run}>
            <RefreshCw /> Re-run analysis
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-[15px] leading-relaxed text-slate-800">{analysis.summary}</p>
          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Key requirements</div>
            <ul className="grid gap-1.5 md:grid-cols-2">
              {analysis.keyRequirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <InfoGrid
            items={[
              { label: "Funding Range", value: analysis.fundingRange },
              { label: "Period of Performance", value: analysis.periodOfPerformance },
              { label: "Application Deadline", value: `${formatDate(analysis.applicationDeadline)} (${Math.max(0, daysUntil(analysis.applicationDeadline))} days)` },
              { label: "Cost Sharing / Match", value: analysis.costSharing },
              { label: "Instrument", value: opp.instrument },
              { label: "Assistance Listing", value: opp.assistanceListing },
            ]}
          />
          <div className="mt-5 border-t border-border pt-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Program Purpose</div>
            <p className="mt-1 text-sm text-slate-700">{analysis.programPurpose}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard title="Eligible Applicants" items={analysis.eligibleApplicants} />
        <ListCard title="Key Priorities" items={analysis.keyPriorities} icon="dot" />
        <ListCard title="Required Attachments" items={analysis.requiredAttachments} icon="dot" />
        <ListCard title="Submission Requirements" items={analysis.submissionRequirements} icon="dot" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Criteria</CardTitle>
            <span className="text-xs text-muted-foreground">{analysis.evaluationCriteria.reduce((s, c) => s + c.points, 0)} points total</span>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {analysis.evaluationCriteria.map((c) => (
              <div key={c.criterion}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{c.criterion}</span>
                  <span className="text-sm font-semibold tabular">{c.points} pts</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(c.points / maxPoints) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Important Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {analysis.importantDates.map((d) => {
                const past = daysUntil(d.date) < 0;
                const isDeadline = d.label === "Application deadline";
                return (
                  <li key={d.label} className="relative">
                    <span className={cn("absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-card", isDeadline ? "bg-red-500" : past ? "bg-slate-300" : "bg-primary")} />
                    <div className={cn("text-sm", isDeadline ? "font-semibold text-red-700" : past ? "text-muted-foreground" : "font-medium")}>{d.label}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3" /> {formatDate(d.date)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <ListCard title="Risks & Watch Items" items={analysis.risks} icon="warn" />
    </div>
  );
}
