"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Ban, Check, ClipboardCheck, ExternalLink, FileSearch, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar, ScoreRing } from "@/components/shared/score-ring";
import { RecommendationBadge, RECOMMENDATION_STYLE } from "@/components/shared/status-badge";
import { Deadline } from "@/components/shared/deadline";
import { dismissMatch, restoreMatch, useAppData } from "@/lib/data-service";
import { BREAKDOWN_LABELS, goNoGoTotal } from "@/lib/matching";
import { eligibilityLabel, riskFromMatch } from "@/lib/selectors";
import type { GrantMatch, MatchBreakdown } from "@/lib/types";
import { cn, formatCompactCurrency } from "@/lib/utils";
import { GoNoGoDialog } from "./go-no-go-dialog";

function fitLabel(v: number) {
  if (v >= 85) return { label: "Strong", cls: "text-emerald-700" };
  if (v >= 65) return { label: "Moderate", cls: "text-amber-700" };
  return { label: "Weak", cls: "text-red-700" };
}

export function MatchDetail({ match }: { match: GrantMatch }) {
  const data = useAppData();
  const [gngOpen, setGngOpen] = useState(false);
  const opp = data.opportunities.find((o) => o.id === match.opportunityId);
  const client = data.clients.find((c) => c.id === match.clientId);
  if (!opp || !client) return null;
  const b = match.breakdown;
  const style = RECOMMENDATION_STYLE[match.recommendation];
  const eligibility = eligibilityLabel(match);
  const risk = riskFromMatch(match);
  const strategic = fitLabel((b.industryAlignment + b.geographicFit) / 2);
  const deadlineFit = fitLabel(b.timelineFeasibility);
  const fundingFit = fitLabel(b.fundingAlignment);
  const dismissed = match.status === "Dismissed";

  const summary = [
    { label: "Eligibility", value: eligibility, cls: eligibility === "Eligible" ? "text-emerald-700" : eligibility === "Not Eligible" ? "text-red-700" : "text-amber-700" },
    { label: "Strategic fit", value: strategic.label, cls: strategic.cls },
    { label: "Deadline feasibility", value: deadlineFit.label, cls: deadlineFit.cls },
    { label: "Funding fit", value: fundingFit.label, cls: fundingFit.cls },
    { label: "Risk level", value: risk, cls: risk === "Low" ? "text-emerald-700" : risk === "Medium" ? "text-amber-700" : "text-red-700" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className={cn("flex flex-col items-center rounded-xl px-4 py-3", style.bg)}>
            <ScoreRing score={match.score} size={92} stroke={7} />
            <span className={cn("mt-1 text-[11px] font-semibold uppercase tracking-wide", style.text)}>Potential Match</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <RecommendationBadge value={match.recommendation} className="px-2 py-1 text-xs" />
              {dismissed && <Badge variant="secondary">Dismissed</Badge>}
              {match.status === "Application Started" && <Badge variant="success">Application started</Badge>}
              {match.status === "Reviewing" && <Badge variant="info">Go/No-Go in review</Badge>}
            </div>
            <Link href={`/opportunities/${opp.id}`} className="mt-2 block text-lg font-semibold leading-snug tracking-tight hover:text-primary">
              {opp.title}
            </Link>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {opp.agency} · {opp.opportunityNumber}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span>
                <span className="text-muted-foreground">Client </span>
                <Link href={`/clients/${client.id}`} className="font-medium hover:text-primary">
                  {client.name}
                </Link>
              </span>
              <span>
                <span className="text-muted-foreground">Award range </span>
                <span className="font-medium tabular">
                  {formatCompactCurrency(opp.awardFloor)}–{formatCompactCurrency(opp.awardCeiling)}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground">Cost share </span>
                <span className="font-medium">{opp.costSharePct ? `${opp.costSharePct}%` : "None"}</span>
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Deadline date={opp.deadline} showIcon />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {summary.map((s) => (
            <div key={s.label} className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className={cn("mt-0.5 text-sm font-semibold", s.cls)}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className="border-b border-border p-5 lg:border-b-0 lg:border-r">
          <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Score Breakdown</h4>
          <div className="space-y-3">
            {(Object.keys(BREAKDOWN_LABELS) as (keyof MatchBreakdown)[]).map((k) => (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-700">{BREAKDOWN_LABELS[k]}</span>
                  <span className="font-semibold tabular">{b[k]}%</span>
                </div>
                <ScoreBar value={b[k]} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5 p-5">
          <div>
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Why it fits</h4>
            <ul className="space-y-1.5">
              {match.reasons.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Risks to resolve</h4>
            {match.risks.length ? (
              <ul className="space-y-1.5">
                {match.risks.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No material risks identified.</p>
            )}
          </div>
          {match.goNoGo && (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Go/No-Go: </span>
              <span className="font-semibold tabular">{goNoGoTotal(match.goNoGo)}/10</span>
              {match.goNoGo.approved && <span className="ml-2 text-emerald-700">· Pursuit approved</span>}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/30 px-5 py-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/opportunities/${opp.id}?tab=nofo`}>
            <FileSearch /> View Analysis
          </Link>
        </Button>
        {match.applicationId ? (
          <Button size="sm" asChild>
            <Link href={`/applications/${match.applicationId}`}>
              Open Application <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button size="sm" onClick={() => setGngOpen(true)} disabled={dismissed}>
            <ClipboardCheck /> Start Application
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clients/${client.id}`}>
            Client profile <ExternalLink />
          </Link>
        </Button>
        <div className="flex-1" />
        {dismissed ? (
          <Button variant="ghost" size="sm" onClick={() => restoreMatch(match.id)}>
            <RotateCcw /> Restore
          </Button>
        ) : (
          !match.applicationId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                dismissMatch(match.id);
                toast("Match dismissed", { description: opp.title, action: { label: "Undo", onClick: () => restoreMatch(match.id) } });
              }}
            >
              <Ban /> Dismiss Match
            </Button>
          )
        )}
      </div>
      <GoNoGoDialog matchId={match.id} open={gngOpen} onOpenChange={setGngOpen} />
    </Card>
  );
}
