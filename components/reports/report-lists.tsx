"use client";
import Link from "next/link";
import { AlertTriangle, Target } from "lucide-react";
import type { AppData } from "@/lib/types";
import { applicationCompletion, isActive } from "@/lib/selectors";
import { cn, daysLeftLabel, daysUntil, formatCompactCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/shared/score-ring";
import { RecommendationBadge, RiskBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

export function TopOpportunities({ data, limit = 6 }: { data: AppData; limit?: number }) {
  const rows = data.matches
    .filter((m) => m.status !== "Dismissed" && !m.applicationId && daysUntil(data.opportunities.find((o) => o.id === m.opportunityId)?.deadline ?? "") >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  if (!rows.length) return <EmptyState icon={Target} title="No open matches" className="m-5" />;
  return (
    <ul className="divide-y divide-border">
      {rows.map((m) => {
        const opp = data.opportunities.find((o) => o.id === m.opportunityId)!;
        const client = data.clients.find((c) => c.id === m.clientId);
        return (
          <li key={m.id}>
            <Link href={`/matches?match=${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
              <ScoreRing score={m.score} size={40} stroke={4} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{opp.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {client?.name} · {opp.agencyCode} · up to {formatCompactCurrency(opp.awardCeiling)}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <RecommendationBadge value={m.recommendation} />
                <span className="text-[11px] text-muted-foreground">{daysLeftLabel(opp.deadline)}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function atRiskApplications(data: AppData) {
  return data.applications
    .filter(isActive)
    .map((a) => {
      const completion = applicationCompletion(a);
      const d = daysUntil(a.deadline);
      const reasons: string[] = [];
      if (a.risk === "High") reasons.push("High risk flagged");
      if (d <= 10 && completion < 80) reasons.push(`${completion}% complete with ${d} days left`);
      const missing = a.compliance.filter((c) => c.status === "Missing").length;
      if (missing && (a.risk !== "Low" || d <= 14)) reasons.push(`${missing} requirement${missing === 1 ? "" : "s"} missing`);
      if (a.risk === "Medium" && !reasons.length) reasons.push("Medium risk flagged");
      return { app: a, completion, reasons, d };
    })
    .filter((r) => r.reasons.length && r.completion < 95)
    .sort((a, b) => a.d - b.d);
}

export function ApplicationsAtRisk({ data }: { data: AppData }) {
  const rows = atRiskApplications(data);
  if (!rows.length) return <EmptyState icon={AlertTriangle} title="No applications at risk" className="m-5" />;
  return (
    <ul className="divide-y divide-border">
      {rows.map(({ app, completion, reasons, d }) => {
        const opp = data.opportunities.find((o) => o.id === app.opportunityId);
        const client = data.clients.find((c) => c.id === app.clientId);
        return (
          <li key={app.id}>
            <Link href={`/applications/${app.id}`} className="block px-5 py-3 hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{opp?.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{client?.name}</div>
                </div>
                <RiskBadge risk={app.risk} />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={completion} className="flex-1" indicatorClassName={completion < 50 ? "bg-amber-500" : undefined} />
                <span className="w-9 text-right text-xs font-medium tabular">{completion}%</span>
                <span className={cn("w-24 text-right text-[11px] font-medium", d <= 10 ? "text-red-600" : "text-muted-foreground")}>{daysLeftLabel(app.deadline)}</span>
              </div>
              <div className="mt-1.5 text-xs text-amber-700">{reasons.join(" · ")}</div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
