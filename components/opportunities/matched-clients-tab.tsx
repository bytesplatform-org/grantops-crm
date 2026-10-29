"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, FileSearch, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBar, ScoreRing } from "@/components/shared/score-ring";
import { RecommendationBadge } from "@/components/shared/status-badge";
import { CalculateMatchDialog } from "@/components/matches/calculate-match-dialog";
import { GoNoGoDialog } from "@/components/matches/go-no-go-dialog";
import { useAppData } from "@/lib/data-service";
import { BREAKDOWN_LABELS, goNoGoTotal } from "@/lib/matching";
import { eligibilityLabel } from "@/lib/selectors";
import type { MatchBreakdown, Opportunity } from "@/lib/types";
import { runMatchClients } from "./match-clients";

export function MatchedClientsTab({ opp }: { opp: Opportunity }) {
  const data = useAppData();
  const router = useRouter();
  const [gng, setGng] = useState<string | undefined>();
  const matches = data.matches.filter((m) => m.opportunityId === opp.id && m.status !== "Dismissed").sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{matches.length} potential client match{matches.length === 1 ? "" : "es"} for this opportunity.</p>
        <div className="flex gap-2">
          <CalculateMatchDialog defaultOpportunityId={opp.id} onCalculated={(m) => router.push(`/matches?match=${m.id}`)} />
          <Button onClick={() => runMatchClients(opp.id, opp.title, router.push)}>
            <Users /> Match All Clients
          </Button>
        </div>
      </div>
      {matches.length === 0 ? (
        <EmptyState icon={Users} title="No client matches yet" description="Run matching to score all active clients against this opportunity." />
      ) : (
        matches.map((m) => {
          const client = data.clients.find((c) => c.id === m.clientId);
          if (!client) return null;
          return (
            <Card key={m.id} className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex items-center gap-4 lg:w-72">
                  <ScoreRing score={m.score} size={60} />
                  <div className="min-w-0">
                    <Link href={`/clients/${client.id}`} className="block truncate font-semibold hover:text-primary">
                      {client.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {client.organizationType} · {client.state}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <RecommendationBadge value={m.recommendation} />
                      <span className="text-[11px] text-muted-foreground">{eligibilityLabel(m)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-2 md:grid-cols-3">
                  {(Object.keys(BREAKDOWN_LABELS) as (keyof MatchBreakdown)[]).map((k) => (
                    <div key={k}>
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="truncate">{BREAKDOWN_LABELS[k]}</span>
                        <span className="font-medium tabular text-foreground">{m.breakdown[k]}%</span>
                      </div>
                      <ScoreBar value={m.breakdown[k]} className="mt-1" />
                    </div>
                  ))}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/matches?match=${m.id}`}>
                      <FileSearch /> View Analysis
                    </Link>
                  </Button>
                  {m.applicationId ? (
                    <Button size="sm" asChild>
                      <Link href={`/applications/${m.applicationId}`}>
                        Open Application <ArrowRight />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setGng(m.id)}>
                      <ClipboardCheck /> {m.goNoGo ? `Go/No-Go ${goNoGoTotal(m.goNoGo)}/10` : "Go/No-Go"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })
      )}
      <GoNoGoDialog matchId={gng} open={!!gng} onOpenChange={(o) => !o && setGng(undefined)} />
    </div>
  );
}
