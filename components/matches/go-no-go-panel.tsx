"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2, Sparkles, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approvePursuit, updateGoNoGo, useAppData } from "@/lib/data-service";
import { GO_NO_GO_CRITERIA, emptyGoNoGo, goNoGoComplete, goNoGoRecommendation, goNoGoTotal } from "@/lib/matching";
import type { GoNoGoAssessment, GoNoGoCriterion, GrantMatch } from "@/lib/types";
import { cn, daysUntil, formatDate } from "@/lib/utils";

type Score = 0 | 1 | 2;

const REC_STYLE = {
  Pursue: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Investigate: "border-amber-200 bg-amber-50 text-amber-700",
  "Too Early / No-Go": "border-red-200 bg-red-50 text-red-700",
} as const;

const SCORE_LABEL: Record<Score, string> = { 0: "Weak", 1: "Partial", 2: "Strong" };

function toScore(v: number): Score {
  return v >= 85 ? 2 : v >= 60 ? 1 : 0;
}

/** Derive suggested Go/No-Go scores from a match breakdown. */
export function suggestedScores(m: GrantMatch, deadline: string): GoNoGoAssessment["scores"] {
  const b = m.breakdown;
  const days = daysUntil(deadline);
  return {
    eligibility: b.organizationEligibility === 100 && b.geographicFit >= 60 ? 2 : b.organizationEligibility > 0 ? 1 : 0,
    strategicAlignment: toScore((b.industryAlignment + b.fundingAlignment) / 2),
    competitivePosition: toScore(b.pastPerformance + 10),
    resourceReadiness: toScore(b.fundingAlignment),
    deadlineFeasibility: days >= 21 ? 2 : days >= 10 ? 1 : 0,
  };
}

export function GoNoGoPanel({ matchId, onApproved }: { matchId: string; onApproved?: (applicationId: string) => void }) {
  const data = useAppData();
  const router = useRouter();
  const match = data.matches.find((m) => m.id === matchId);
  const opp = data.opportunities.find((o) => o.id === match?.opportunityId);
  const client = data.clients.find((c) => c.id === match?.clientId);
  const assessment = useMemo(() => match?.goNoGo ?? emptyGoNoGo(), [match?.goNoGo]);

  if (!match || !opp || !client) return <p className="text-sm text-muted-foreground">Match not found.</p>;

  const total = goNoGoTotal(assessment);
  const complete = goNoGoComplete(assessment);
  const rec = goNoGoRecommendation(total);
  const approved = assessment.approved && !!match.applicationId;
  const approver = data.team.find((t) => t.id === assessment.approvedBy);

  const setScore = (key: GoNoGoCriterion, v: Score) => updateGoNoGo(matchId, { scores: { [key]: v } });

  const approve = () => {
    if (total < 5 && !window.confirm(`This assessment scores ${total}/10 (${rec}). Approve pursuit anyway?`)) return;
    const appId = approvePursuit(matchId);
    if (!appId) return;
    toast.success("Application workspace created", {
      description: `${opp.title} — ${client.name}`,
      action: { label: "Open", onClick: () => router.push(`/applications/${appId}`) },
    });
    onApproved?.(appId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div>
          <div className="text-[13px] text-muted-foreground">Go / No-Go Score</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular">{total}</span>
            <span className="text-sm text-muted-foreground">/ 10</span>
          </div>
        </div>
        <div className="text-right">
          <span className={cn("inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide", complete ? REC_STYLE[rec] : "border-border bg-card text-muted-foreground")}>
            {complete ? rec : "Scoring in progress"}
          </span>
          <div className="mt-1 text-[11px] text-muted-foreground">0–4 No-Go · 5–7 Investigate · 8–10 Pursue</div>
        </div>
      </div>

      {!approved && (
        <div className="flex justify-end">
          <button
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            onClick={() => updateGoNoGo(matchId, { scores: suggestedScores(match, opp.deadline) })}
          >
            <Sparkles className="size-3" /> Use suggested scores from match analysis
          </button>
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        {GO_NO_GO_CRITERIA.map((c) => {
          const v = assessment.scores[c.key];
          return (
            <div key={c.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-medium">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.hint}</div>
              </div>
              <div className="inline-flex shrink-0 rounded-md border border-border bg-muted p-0.5" role="radiogroup" aria-label={c.label}>
                {([0, 1, 2] as Score[]).map((s) => (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={v === s}
                    disabled={approved}
                    onClick={() => setScore(c.key, s)}
                    className={cn(
                      "flex h-8 w-[68px] flex-col items-center justify-center rounded-[5px] text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                      v === s
                        ? s === 2
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                          : s === 1
                            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                            : "bg-red-100 text-red-800 ring-1 ring-red-200"
                        : "text-muted-foreground hover:bg-card hover:text-foreground",
                    )}
                  >
                    <span className="leading-none">{s}</span>
                    <span className="text-[9px] font-medium leading-none opacity-80 mt-0.5">{SCORE_LABEL[s]}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`gng-notes-${matchId}`} className="text-xs font-medium text-slate-700">
          Assessment notes
        </label>
        <Textarea
          id={`gng-notes-${matchId}`}
          key={matchId}
          defaultValue={assessment.notes}
          disabled={approved}
          onBlur={(e) => e.target.value !== assessment.notes && updateGoNoGo(matchId, { notes: e.target.value })}
          placeholder="Capture cost-share confirmation, partner commitments, and open questions…"
          className="min-h-20"
        />
      </div>

      {approved ? (
        <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
            <div>
              <div className="text-sm font-medium text-emerald-800">Pursuit approved</div>
              <div className="text-xs text-emerald-700">
                {approver?.name ?? "Team"} · {formatDate(assessment.approvedAt)}
              </div>
            </div>
          </div>
          <Button asChild size="sm" variant="success">
            <Link href={`/applications/${match.applicationId}`}>
              Open Application Workspace <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{complete ? "Approving creates the application workspace, starter tasks, and review stages." : "Score all five criteria to approve."}</p>
          <Button onClick={approve} disabled={!complete}>
            <ThumbsUp /> Approve Pursuit
          </Button>
        </div>
      )}
    </div>
  );
}
