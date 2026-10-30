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
import { ScoreRing } from "@/components/shared/score-ring";
import { OpportunityStatusBadge } from "@/components/shared/status-badge";
import { toggleSaveOpportunity } from "@/lib/data-service";
import type { Client, GrantMatch, Opportunity } from "@/lib/types";
import { cn, formatCompactCurrency } from "@/lib/utils";
import { runMatchClients } from "./match-clients";

export function OpportunityRow({
  opp,
  matches,
  clients,
  focusMatch,
}: {
  opp: Opportunity;
  matches: GrantMatch[];
  clients: Client[];
  focusMatch?: GrantMatch;
}) {
  const router = useRouter();
  const href = `/opportunities/${opp.id}`;
  return (
    <Card className="group p-0 transition-colors hover:border-zinc-300">
      <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center">
        {focusMatch && (
          <Link href={`/matches?match=${focusMatch.id}`} className="shrink-0" aria-label="View match analysis">
            <ScoreRing score={focusMatch.score} size={48} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Link href={href} className="min-w-0 text-[15px] font-medium leading-snug tracking-tight hover:text-primary">
              {opp.title}
            </Link>
            <OpportunityStatusBadge status={opp.status} />
          </div>
          <div className="mt-1 truncate text-[13px] text-muted-foreground">{opp.agency}</div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-6 text-sm xl:w-[240px]">
          <div>
            <div className="text-[13px] text-muted-foreground">Award range</div>
            <div className="font-medium tabular">
              {formatCompactCurrency(opp.awardFloor)} – {formatCompactCurrency(opp.awardCeiling)}
            </div>
          </div>
          <div>
            <div className="text-[13px] text-muted-foreground">Deadline</div>
            <Deadline date={opp.deadline} compact />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 xl:w-[200px] xl:justify-end">
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
