"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Filter, Landmark, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppData } from "@/lib/data-service";
import type { OrganizationType } from "@/lib/types";
import { daysUntil, formatCompactCurrency } from "@/lib/utils";
import { OpportunityRow } from "./opportunity-row";

const FUNDING_BUCKETS = [
  { value: "", label: "Any award size" },
  { value: "lt250", label: "Ceiling under $250K", test: (v: number) => v < 250_000 },
  { value: "250-750", label: "$250K – $750K", test: (v: number) => v >= 250_000 && v <= 750_000 },
  { value: "750-1500", label: "$750K – $1.5M", test: (v: number) => v > 750_000 && v <= 1_500_000 },
  { value: "gt1500", label: "Over $1.5M", test: (v: number) => v > 1_500_000 },
];

const DEADLINES = [
  { value: "", label: "Any deadline" },
  { value: "14", label: "Due within 14 days" },
  { value: "30", label: "Due within 30 days" },
  { value: "60", label: "Due within 60 days" },
  { value: "closed", label: "Closed / archived" },
];

const ORG_TYPES: OrganizationType[] = ["Small Business", "Nonprofit", "Tribal Organization", "Local Government", "Institution of Higher Education", "Cooperative", "Workforce Board"];

type Sort = "deadline" | "ceiling" | "match";

export function OpportunitiesView() {
  const data = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const clientParam = params.get("client") ?? "";
  const [q, setQ] = useState("");
  const [agency, setAgency] = useState("");
  const [category, setCategory] = useState("");
  const [funding, setFunding] = useState("");
  const [deadline, setDeadline] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [status, setStatus] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>(clientParam ? "match" : "deadline");

  const setClient = (id: string) => {
    const p = new URLSearchParams(params.toString());
    if (id) p.set("client", id);
    else p.delete("client");
    router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false });
    if (id) setSort("match");
  };

  const contextClient = data.clients.find((c) => c.id === clientParam);
  const agencies = useMemo(() => [...new Set(data.opportunities.map((o) => o.agency))].sort(), [data.opportunities]);
  const categories = useMemo(() => [...new Set(data.opportunities.map((o) => o.category))].sort(), [data.opportunities]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const bucket = FUNDING_BUCKETS.find((b) => b.value === funding);
    const liveMatches = data.matches.filter((m) => m.status !== "Dismissed");
    return data.opportunities
      .map((opp) => {
        const matches = liveMatches.filter((m) => m.opportunityId === opp.id).sort((a, b) => b.score - a.score);
        const focusMatch = clientParam ? matches.find((m) => m.clientId === clientParam) : undefined;
        return { opp, matches, focusMatch };
      })
      .filter(({ opp, focusMatch }) => {
        if (clientParam && !focusMatch) return false;
        if (term && !`${opp.title} ${opp.agency} ${opp.subAgency} ${opp.opportunityNumber} ${opp.keywords.join(" ")}`.toLowerCase().includes(term)) return false;
        if (agency && opp.agency !== agency) return false;
        if (category && opp.category !== category) return false;
        if (bucket?.test && !bucket.test(opp.awardCeiling)) return false;
        if (eligibility && !opp.eligibility.includes(eligibility as OrganizationType)) return false;
        if (status && opp.status !== status) return false;
        if (savedOnly && !opp.saved) return false;
        const d = daysUntil(opp.deadline);
        if (deadline === "closed") return d < 0;
        if (deadline && (d < 0 || d > Number(deadline))) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "ceiling") return b.opp.awardCeiling - a.opp.awardCeiling;
        if (sort === "match") return (b.focusMatch?.score ?? b.matches[0]?.score ?? 0) - (a.focusMatch?.score ?? a.matches[0]?.score ?? 0);
        const da = daysUntil(a.opp.deadline);
        const db = daysUntil(b.opp.deadline);
        if ((da < 0) !== (db < 0)) return da < 0 ? 1 : -1;
        return da < 0 ? db - da : da - db;
      });
  }, [data, q, agency, category, funding, deadline, eligibility, status, savedOnly, sort, clientParam]);

  const activeFilters = [agency, category, funding, deadline, eligibility, status].filter(Boolean).length + (savedOnly ? 1 : 0);
  const clear = () => {
    setAgency("");
    setCategory("");
    setFunding("");
    setDeadline("");
    setEligibility("");
    setStatus("");
    setSavedOnly(false);
    setQ("");
  };
  const moreCount = [category, funding, eligibility, status].filter(Boolean).length + (savedOnly ? 1 : 0);
  const open = data.opportunities.filter((o) => daysUntil(o.deadline) >= 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funding Opportunities"
        description={`${open.length} open federal opportunities (sample data for demonstration).`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/matches">
              <Landmark /> View matches
            </Link>
          </Button>
        }
      />

      {contextClient && (
        <div className="flex items-center gap-3 rounded-2xl border border-lime-200 bg-primary-soft px-4 py-3">
          <Briefcase className="size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 truncate text-sm">
            Potential matches for{" "}
            <Link href={`/clients/${contextClient.id}`} className="font-medium text-primary hover:underline">
              {contextClient.name}
            </Link>
            <span className="text-[13px] text-muted-foreground"> · Target {formatCompactCurrency(contextClient.fundingProfile.targetAmount)} · {contextClient.state}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setClient("")} aria-label="Clear client filter">
            <X /> Clear
          </Button>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search opportunities…" className="pl-8" aria-label="Search opportunities" />
          </div>
          <Select value={clientParam} onValueChange={setClient} aria-label="Client" className="w-44">
            <option value="">Any client</option>
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={agency} onValueChange={setAgency} aria-label="Agency" className="w-44">
            <option value="">All agencies</option>
            {agencies.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
          <Select value={deadline} onValueChange={setDeadline} aria-label="Deadline" className="w-44">
            {DEADLINES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal /> More filters
                {moreCount > 0 && <span className="rounded bg-primary-soft px-1.5 text-[11px] font-medium text-primary tabular">{moreCount}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 p-4">
              <FilterField label="Category">
                <Select value={category} onValueChange={setCategory} aria-label="Category">
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Award size">
                <Select value={funding} onValueChange={setFunding} aria-label="Funding amount">
                  {FUNDING_BUCKETS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Eligibility">
                <Select value={eligibility} onValueChange={setEligibility} aria-label="Eligibility">
                  <option value="">Any eligibility</option>
                  {ORG_TYPES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Status">
                <Select value={status} onValueChange={setStatus} aria-label="Status">
                  <option value="">Any status</option>
                  {["Posted", "Forecasted", "Closing Soon", "Closed", "Archived"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </FilterField>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={savedOnly} onCheckedChange={(v) => setSavedOnly(v === true)} />
                <Star className="size-3.5 text-amber-500" /> Saved only
              </label>
            </PopoverContent>
          </Popover>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)} className="w-40" aria-label="Sort">
            <option value="deadline">Sort: Deadline</option>
            <option value="ceiling">Sort: Award size</option>
            <option value="match">Sort: Best match</option>
          </Select>
        </div>
        <div className="mt-3 flex items-center justify-between text-[13px] text-muted-foreground">
          <span>
            {rows.length} opportunit{rows.length === 1 ? "y" : "ies"}
          </span>
          {activeFilters > 0 && (
            <button onClick={clear} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <Filter className="size-3" /> Clear {activeFilters} filter{activeFilters === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Search} title="No opportunities match these filters" description="Broaden your search or clear filters to see more opportunities." action={<Button variant="outline" size="sm" onClick={clear}>Clear filters</Button>} />
      ) : (
        <div className="space-y-3">
          {rows.map(({ opp, matches, focusMatch }) => (
            <OpportunityRow key={opp.id} opp={opp} matches={matches} clients={data.clients} focusMatch={focusMatch} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
