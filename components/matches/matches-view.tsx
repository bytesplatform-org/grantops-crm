"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Gauge, GitCompareArrows, Search, Target, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreRing } from "@/components/shared/score-ring";
import { RecommendationBadge } from "@/components/shared/status-badge";
import { useAppData } from "@/lib/data-service";
import type { MatchRecommendation } from "@/lib/types";
import { cn, daysLeftLabel, daysUntil, formatCompactCurrency, formatShortDate } from "@/lib/utils";
import { CalculateMatchDialog } from "./calculate-match-dialog";
import { MatchDetail } from "./match-detail";

const RECS: MatchRecommendation[] = ["Pursue", "Investigate", "Low Priority", "Not Eligible"];

export function MatchesView() {
  const data = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const clientFilter = params.get("client") ?? "";
  const selectedParam = params.get("match");
  const [q, setQ] = useState("");
  const [rec, setRec] = useState<"" | MatchRecommendation>("");
  const [status, setStatus] = useState("");
  const [showDismissed, setShowDismissed] = useState(false);

  const setParam = (key: string, value?: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.matches
      .map((m) => ({ m, opp: data.opportunities.find((o) => o.id === m.opportunityId), client: data.clients.find((c) => c.id === m.clientId) }))
      .filter(({ m, opp, client }) => {
        if (!opp || !client) return false;
        if (!showDismissed && m.status === "Dismissed") return false;
        if (clientFilter && m.clientId !== clientFilter) return false;
        if (rec && m.recommendation !== rec) return false;
        if (status && m.status !== status) return false;
        if (term && !`${opp.title} ${opp.agency} ${client.name}`.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => {
        const aw = a.m.status === "Application Started" ? 1 : 0;
        const bw = b.m.status === "Application Started" ? 1 : 0;
        return aw - bw || b.m.score - a.m.score;
      });
  }, [data, q, rec, status, showDismissed, clientFilter]);

  const active = data.matches.filter((m) => m.status !== "Dismissed");
  const scope = clientFilter ? active.filter((m) => m.clientId === clientFilter) : active;
  const pursue = scope.filter((m) => m.recommendation === "Pursue").length;
  const avg = scope.length ? Math.round(scope.reduce((s, m) => s + m.score, 0) / scope.length) : 0;
  const funding = scope.reduce((s, m) => s + (data.opportunities.find((o) => o.id === m.opportunityId)?.awardCeiling ?? 0), 0);

  const selected = data.matches.find((m) => m.id === selectedParam) ?? rows.find((r) => r.m.clientId === "c-horizon" && r.m.status !== "Application Started")?.m ?? rows[0]?.m;
  const clientName = data.clients.find((c) => c.id === clientFilter)?.name;

  return (
    <div>
      <PageHeader
        title="Client ↔ Grant Matching"
        description="Potential matches scored against each client's funding profile, eligibility, and capacity."
        actions={<CalculateMatchDialog defaultClientId={clientFilter || undefined} onCalculated={(m) => setParam("match", m.id)} />}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Potential Matches" value={scope.length} icon={GitCompareArrows} hint={clientName ?? "Across all clients"} />
        <StatCard label="Recommended to Pursue" value={pursue} icon={Target} hint={`${scope.length ? Math.round((pursue / scope.length) * 100) : 0}% of matches`} />
        <StatCard label="Average Match Score" value={`${avg}%`} icon={Gauge} hint="Weighted across six factors" />
        <StatCard label="Funding Identified" value={formatCompactCurrency(funding)} icon={Wallet} hint="Sum of award ceilings" />
      </div>

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search opportunity, agency or client…" className="pl-8" aria-label="Search matches" />
        </div>
        <Select value={clientFilter} onChange={(e) => setParam("client", e.target.value)} className="w-52" aria-label="Client">
          <option value="">All clients</option>
          {data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={rec} onChange={(e) => setRec(e.target.value as MatchRecommendation | "")} className="w-40" aria-label="Recommendation">
          <option value="">All recommendations</option>
          {RECS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44" aria-label="Status">
          <option value="">All statuses</option>
          {["New", "Reviewing", "Application Started", "Dismissed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <label className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Switch checked={showDismissed} onCheckedChange={setShowDismissed} aria-label="Show dismissed" /> Show dismissed
        </label>
      </Card>

      {rows.length === 0 ? (
        <EmptyState icon={GitCompareArrows} title="No matches for these filters" description="Adjust filters or calculate a new match for a client." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[400px_1fr]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span>{rows.length} matches</span>
              <span>Sorted by score</span>
            </div>
            <ul className="max-h-[calc(100vh-300px)] min-h-96 divide-y divide-border overflow-y-auto scrollbar-thin">
              {rows.map(({ m, opp, client }) => {
                const isSel = selected?.id === m.id;
                const days = daysUntil(opp!.deadline);
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => setParam("match", m.id)}
                      className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", isSel ? "bg-primary-soft/60 shadow-[inset_3px_0_0_var(--primary)]" : "hover:bg-muted/50", m.status === "Dismissed" && "opacity-60")}
                    >
                      <ScoreRing score={m.score} size={44} stroke={4} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{opp!.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{client!.name}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <RecommendationBadge value={m.recommendation} />
                          <span className={cn("text-[11px]", days < 0 ? "text-muted-foreground" : days <= 10 ? "text-red-600" : "text-muted-foreground")}>
                            {days < 0 ? `Closed ${formatShortDate(opp!.deadline)}` : `${formatShortDate(opp!.deadline)} · ${daysLeftLabel(opp!.deadline)}`}
                          </span>
                        </div>
                      </div>
                      {m.status === "Application Started" && <span className="size-2 shrink-0 rounded-full bg-emerald-500" title="Application started" />}
                      {m.status === "New" && <span className="size-2 shrink-0 rounded-full bg-primary" title="New match" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="min-w-0">{selected && <MatchDetail key={selected.id} match={selected} />}</div>
        </div>
      )}
    </div>
  );
}
