"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, LayoutGrid, List, MapPin, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, SegmentedList, SegmentedTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { primaryContact, useAppData } from "@/lib/data-service";
import { isActive } from "@/lib/selectors";
import { formatCompactCurrency, formatCurrency, relativeTime } from "@/lib/utils";
import { ORG_TYPES } from "@/components/leads/constants";
import { ClientFormDialog } from "./client-form-dialog";

export function ClientsView() {
  const data = useAppData();
  const router = useRouter();
  const [view, setView] = useState<"table" | "cards">("table");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [orgType, setOrgType] = useState("all");
  const [state, setState] = useState("all");
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      data.clients.map((c) => {
        const apps = data.applications.filter((a) => a.clientId === c.id);
        return {
          client: c,
          contact: primaryContact(data, c.id),
          openApps: apps.filter(isActive).length,
          matches: data.matches.filter((m) => m.clientId === c.id && m.status !== "Dismissed").length,
        };
      }),
    [data],
  );
  const states = useMemo(() => [...new Set(data.clients.map((c) => c.state).filter(Boolean))].sort(), [data.clients]);

  const filtered = rows.filter(({ client: c, contact }) => {
    const term = q.trim().toLowerCase();
    return (
      (!term || [c.name, c.industry, c.city, c.state, contact?.name ?? "", ...c.naics, ...c.fundingInterests].some((s) => s.toLowerCase().includes(term))) &&
      (status === "all" || c.status === status) &&
      (orgType === "all" || c.organizationType === orgType) &&
      (state === "all" || c.state === state)
    );
  });

  const totals = {
    active: data.clients.filter((c) => c.status === "Active").length,
    onboarding: data.clients.filter((c) => c.status === "Onboarding").length,
    potential: data.clients.reduce((s, c) => s + c.potentialFunding, 0),
    openApps: data.applications.filter(isActive).length,
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Organizations you represent, their funding profiles, and active pursuits."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add Client
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active clients" value={totals.active} hint={`${totals.onboarding} onboarding`} />
        <StatCard label="Potential funding" value={formatCompactCurrency(totals.potential)} hint="Across all client funding goals" />
        <StatCard label="Open applications" value={totals.openApps} hint="In preparation or review" />
        <StatCard label="Avg. potential / client" value={formatCompactCurrency(totals.potential / Math.max(1, data.clients.length))} hint="Portfolio average" />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, industry, NAICS…" className="pl-8" aria-label="Search clients" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" aria-label="Filter by status">
          <option value="all">All statuses</option>
          {["Active", "Onboarding", "Paused", "Inactive"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={orgType} onChange={(e) => setOrgType(e.target.value)} className="w-48" aria-label="Filter by organization type">
          <option value="all">All org types</option>
          {ORG_TYPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={state} onChange={(e) => setState(e.target.value)} className="w-40" aria-label="Filter by state">
          <option value="all">All states</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} clients</span>
        <div className="ml-auto">
          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "cards")}>
            <SegmentedList>
              <SegmentedTrigger value="table">
                <List /> Table
              </SegmentedTrigger>
              <SegmentedTrigger value="cards">
                <LayoutGrid /> Cards
              </SegmentedTrigger>
            </SegmentedList>
          </Tabs>
        </div>
      </div>

      {!filtered.length ? (
        <EmptyState icon={Briefcase} title="No clients match your filters" description="Try a different search or clear filters." />
      ) : view === "table" ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Company</TableHead>
                <TableHead>Primary Contact</TableHead>
                <TableHead>Org Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>NAICS</TableHead>
                <TableHead>Service Area</TableHead>
                <TableHead className="text-right">Funding Goal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Open Apps</TableHead>
                <TableHead className="text-right">Potential</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ client: c, contact, openApps }) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/clients/${c.id}`)}>
                  <TableCell>
                    <Link href={`/clients/${c.id}`} className="font-medium hover:text-primary" onClick={(e) => e.stopPropagation()}>
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.industry}</div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-nowrap text-[13px]">{contact?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{contact?.title}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{c.organizationType}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{[c.city, c.state].filter(Boolean).join(", ")}</TableCell>
                  <TableCell className="text-xs tabular text-slate-600">{c.naics.join(", ") || "—"}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs text-slate-600">{c.serviceArea}</TableCell>
                  <TableCell className="text-right tabular">{formatCurrency(c.fundingProfile.targetAmount)}</TableCell>
                  <TableCell>
                    <ClientStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-center font-medium tabular">{openApps}</TableCell>
                  <TableCell className="text-right font-medium tabular">{formatCompactCurrency(c.potentialFunding)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(c.lastActivity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ client: c, contact, openApps, matches }) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{c.name}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {[c.city, c.state].filter(Boolean).join(", ")} · {c.organizationType}
                    </div>
                  </div>
                  <ClientStatusBadge status={c.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-slate-600">{c.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.fundingInterests.slice(0, 3).map((f) => (
                    <Badge key={f} variant="secondary">
                      {f}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <div>
                    <div className="text-sm font-semibold tabular">{formatCompactCurrency(c.potentialFunding)}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Potential</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold tabular">{openApps}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Open apps</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold tabular">{matches}</div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Matches</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{contact?.name}</span>
                  <span>{relativeTime(c.lastActivity)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <ClientFormDialog open={open} onOpenChange={setOpen} onCreated={(id) => router.push(`/clients/${id}`)} />
    </div>
  );
}
