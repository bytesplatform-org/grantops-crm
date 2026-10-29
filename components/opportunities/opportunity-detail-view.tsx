"use client";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, ExternalLink, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { NotFoundCard } from "@/components/shared/not-found-card";
import { DemoBadge, OpportunityStatusBadge } from "@/components/shared/status-badge";
import { deadlineTone } from "@/components/shared/deadline";
import { toggleSaveOpportunity, useAppData } from "@/lib/data-service";
import { cn, daysLeftLabel, daysUntil, formatCompactCurrency, formatDate } from "@/lib/utils";
import { runMatchClients } from "./match-clients";
import { NofoAnalysisTab } from "./nofo-analysis-tab";
import { MatchedClientsTab } from "./matched-clients-tab";
import { DocumentsTab, EligibilityTab, OverviewTab, RequirementsTab } from "./opportunity-tabs";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "nofo", label: "NOFO Analysis" },
  { value: "eligibility", label: "Eligibility" },
  { value: "matches", label: "Matched Clients" },
  { value: "requirements", label: "Requirements" },
  { value: "documents", label: "Documents" },
];

export function OpportunityDetailView() {
  const { id } = useParams<{ id: string }>();
  const data = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get("tab")) ? params.get("tab")! : "overview";
  const opp = data.opportunities.find((o) => o.id === id);

  if (!opp) return <NotFoundCard title="Opportunity not found" href="/opportunities" label="Back to opportunities" />;

  const setTab = (v: string) => router.replace(`${pathname}?tab=${v}`, { scroll: false });
  const matchCount = data.matches.filter((m) => m.opportunityId === opp.id && m.status !== "Dismissed").length;
  const analyzed = !!data.nofoAnalyses[opp.id];
  const days = daysUntil(opp.deadline);

  const facts = [
    { label: "Deadline", value: formatDate(opp.deadline), sub: days < 0 ? "Closed" : daysLeftLabel(opp.deadline), subCls: deadlineTone(opp.deadline) },
    { label: "Funding Range", value: `${formatCompactCurrency(opp.awardFloor)} – ${formatCompactCurrency(opp.awardCeiling)}`, sub: `${formatCompactCurrency(opp.estimatedFunding)} program total` },
    { label: "Opportunity Number", value: opp.opportunityNumber, sub: `Assistance Listing ${opp.assistanceListing}`, mono: true },
    { label: "Cost Share", value: opp.costSharePct ? `${opp.costSharePct}%` : "None", sub: opp.instrument },
    { label: "Potential Matches", value: String(matchCount), sub: analyzed ? "NOFO analyzed" : "NOFO not yet analyzed", subCls: analyzed ? "text-emerald-700" : "text-amber-700" },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">{opp.agencyCode}</span>
            <span className="text-sm text-muted-foreground">
              {opp.agency} · {opp.subAgency}
            </span>
            <OpportunityStatusBadge status={opp.status} />
            <DemoBadge />
          </div>
          <h1 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight">{opp.title}</h1>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-4" /> Closes {formatDate(opp.deadline)} at 11:59 p.m. ET
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => toggleSaveOpportunity(opp.id)} aria-pressed={opp.saved}>
            <Star className={cn(opp.saved && "fill-amber-400 text-amber-500")} /> {opp.saved ? "Saved" : "Save"}
          </Button>
          <Tooltip content="Demo data — this sample opportunity is not a live Grants.gov listing.">
            <Button variant="outline" asChild>
              <a href="https://www.grants.gov/" target="_blank" rel="noopener noreferrer">
                View on Grants.gov <ExternalLink />
              </a>
            </Button>
          </Tooltip>
          <Button onClick={() => runMatchClients(opp.id, opp.title, (h) => router.push(h))}>
            <Users /> Match Clients
          </Button>
        </div>
      </div>

      <Card className="mb-5 grid grid-cols-2 divide-border md:grid-cols-5 md:divide-x">
        {facts.map((f) => (
          <div key={f.label} className="px-5 py-3.5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</div>
            <div className={cn("mt-1 truncate text-[15px] font-semibold tabular", f.mono && "font-mono text-[13px]")}>{f.value}</div>
            <div className={cn("mt-0.5 truncate text-xs text-muted-foreground", f.subCls)}>{f.sub}</div>
          </div>
        ))}
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === "nofo" && !analyzed && <span className="size-1.5 rounded-full bg-amber-500" />}
              {t.value === "matches" && <span className="rounded bg-muted px-1.5 text-[10px] font-semibold tabular">{matchCount}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab opp={opp} />
        </TabsContent>
        <TabsContent value="nofo">
          <NofoAnalysisTab opp={opp} />
        </TabsContent>
        <TabsContent value="eligibility">
          <EligibilityTab opp={opp} />
        </TabsContent>
        <TabsContent value="matches">
          <MatchedClientsTab opp={opp} />
        </TabsContent>
        <TabsContent value="requirements">
          <RequirementsTab opp={opp} onAnalyze={() => setTab("nofo")} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab opp={opp} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
