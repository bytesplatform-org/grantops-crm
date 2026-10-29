"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, GitCompareArrows, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/score-ring";
import { RecommendationBadge } from "@/components/shared/status-badge";
import { Deadline } from "@/components/shared/deadline";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppData } from "@/lib/data-service";
import { eligibilityLabel } from "@/lib/selectors";
import type { Client, GrantMatch } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";

export function ClientOpportunitiesTab({ client, matches }: { client: Client; matches: GrantMatch[] }) {
  const data = useAppData();
  const router = useRouter();
  const sorted = [...matches].sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {sorted.length} potential matches for {client.name}, ranked by match score. Scores are advisory and require eligibility review.
        </p>
        <Button onClick={() => router.push(`/opportunities?client=${client.id}`)}>
          <Search /> Find more funding
        </Button>
      </div>
      {!sorted.length && <EmptyState icon={GitCompareArrows} title="No matched opportunities yet" description="Run Find Funding to discover potential matches for this client." />}
      <div className="space-y-3">
        {sorted.map((m) => {
          const opp = data.opportunities.find((o) => o.id === m.opportunityId);
          if (!opp) return null;
          return (
            <Card key={m.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
              <ScoreRing score={m.score} size={58} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/opportunities/${opp.id}`} className="font-semibold hover:text-primary">
                    {opp.title}
                  </Link>
                  <RecommendationBadge value={m.recommendation} />
                  <Badge variant="outline">{m.status}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {opp.agency} · {opp.opportunityNumber} · {formatCompactCurrency(opp.awardFloor)}–{formatCompactCurrency(opp.awardCeiling)} · Eligibility: {eligibilityLabel(m)}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {m.reasons.slice(0, 2).map((r) => (
                    <span key={r} className="text-emerald-700">
                      ✓ {r}
                    </span>
                  ))}
                  {m.risks.slice(0, 1).map((r) => (
                    <span key={r} className="text-amber-700">
                      ! {r}
                    </span>
                  ))}
                </div>
              </div>
              <Deadline date={opp.deadline} className="w-28 shrink-0" />
              <div className="flex shrink-0 gap-2">
                {m.applicationId ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/applications/${m.applicationId}`}>Open application</Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/matches?client=${client.id}&match=${m.id}`}>View analysis</Link>
                  </Button>
                )}
                <Button size="icon-sm" variant="ghost" asChild aria-label="Open opportunity">
                  <Link href={`/opportunities/${opp.id}`}>
                    <ExternalLink />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
