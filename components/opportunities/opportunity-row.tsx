"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FileSearch, MoreHorizontal, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { Avatar } from "@/components/shared/avatar";
import { Deadline } from "@/components/shared/deadline";
import { ScoreRing, scoreColor } from "@/components/shared/score-ring";
import { DemoBadge, OpportunityStatusBadge, RecommendationBadge } from "@/components/shared/status-badge";
import { toggleSaveOpportunity } from "@/lib/data-service";
import type { Client, GrantMatch, Opportunity } from "@/lib/types";
import { cn, formatCompactCurrency } from "@/lib/utils";
import { runMatchClients } from "./match-clients";

export function OpportunityRow({
  opp,
  matches,
  clients,
  focusMatch,
  analyzed,
}: {
  opp: Opportunity;
  matches: GrantMatch[];
  clients: Client[];
  focusMatch?: GrantMatch;
  analyzed: boolean;
}) {
  const router = useRouter();
  const href = `/opportunities/${opp.id}`;
  return (
    <Card className="group p-0 transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center">
        {focusMatch && (
          <Link href={`/matches?match=${focusMatch.id}`} className="flex shrink-0 flex-col items-center gap-1 xl:w-20" aria-label="View match analysis">
            <ScoreRing score={focusMatch.score} size={58} />
            <RecommendationBadge value={focusMatch.recommendation} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">{opp.agencyCode}</span>
            <span className="truncate text-xs text-muted-foreground">
              {opp.agency} · {opp.subAgency}
            </span>
          </div>
          <Link href={href} className="mt-1.5 block text-[15px] font-semibold leading-snug tracking-tight hover:text-primary">
            {opp.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono text-[11px]">{opp.opportunityNumber}</span>
            <span>{opp.instrument}</span>
            <span>{opp.category}</span>
            <span>Cost share: {opp.costSharePct ? `${opp.costSharePct}%` : "None"}</span>
            <OpportunityStatusBadge status={opp.status} />
            {analyzed && <span className="text-emerald-700">● NOFO analyzed</span>}
            <DemoBadge className="text-[10px] text-muted-foreground" />
          </div>
          <div className="mt-2 line-clamp-1 text-xs text-slate-600">Eligible: {opp.eligibility.join(" · ")}</div>
        </div>
        <div className="grid shrink-0 grid-cols-3 gap-4 text-sm xl:w-[330px]">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Program</div>
            <div className="font-semibold tabular">{formatCompactCurrency(opp.estimatedFunding)}</div>
            <div className="text-[11px] text-muted-foreground">~{opp.expectedAwards} awards</div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Award range</div>
            <div className="font-semibold tabular">{formatCompactCurrency(opp.awardCeiling)}</div>
            <div className="text-[11px] text-muted-foreground">floor {formatCompactCurrency(opp.awardFloor)}</div>
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Deadline</div>
            <Deadline date={opp.deadline} compact />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 xl:w-[220px] xl:justify-end">
          <div className="flex -space-x-1.5">
            {matches.slice(0, 4).map((m) => {
              const c = clients.find((x) => x.id === m.clientId);
              return c ? (
                <Tooltip key={m.id} content={`${c.name} · ${m.score}%`}>
                  <Link href={`/matches?match=${m.id}`} className="rounded-full ring-2 ring-card">
                    <Avatar name={c.name} size="sm" className="bg-slate-600" />
                  </Link>
                </Tooltip>
              ) : null;
            })}
            {matches.length > 4 && <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">+{matches.length - 4}</span>}
          </div>
          {matches.length > 0 && !focusMatch && (
            <span className="text-xs font-semibold tabular" style={{ color: scoreColor(matches[0].score) }}>
              {matches[0].score}%
            </span>
          )}
          <button
            onClick={() => toggleSaveOpportunity(opp.id)}
            className={cn("rounded-md p-1.5 hover:bg-muted", opp.saved ? "text-amber-500" : "text-slate-300 hover:text-slate-500")}
            aria-label={opp.saved ? "Unsave opportunity" : "Save opportunity"}
            aria-pressed={opp.saved}
          >
            <Star className={cn("size-4", opp.saved && "fill-current")} />
          </button>
          <Button variant="outline" size="sm" asChild>
            <Link href={href}>
              <Eye /> View
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => router.push(href)}>
                <Eye /> View Opportunity
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(`${href}?tab=nofo`)}>
                <FileSearch /> Analyze NOFO
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => runMatchClients(opp.id, opp.title, router.push)}>
                <Users /> Match Clients
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
