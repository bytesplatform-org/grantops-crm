"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { primaryContact, useAppData } from "@/lib/data-service";
import { isActive } from "@/lib/selectors";
import { formatCompactCurrency } from "@/lib/utils";
import { ORG_TYPES } from "@/components/leads/constants";
import { ClientFormDialog } from "./client-form-dialog";

export function ClientsView() {
  const data = useAppData();
  const router = useRouter();
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
        description="Organizations you represent."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add Client
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard highlight label="Active clients" value={totals.active} hint={`${totals.onboarding} onboarding`} />
        <StatCard label="Open applications" value={totals.openApps} />
        <StatCard label="Potential funding" value={formatCompactCurrency(totals.potential)} />
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
        <span className="ml-auto text-[13px] text-muted-foreground">{filtered.length} clients</span>
      </div>

      {!filtered.length ? (
        <EmptyState icon={Briefcase} title="No clients match your filters" description="Try a different search or clear filters." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Org Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Open Apps</TableHead>
                <TableHead className="text-right">Potential</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ client: c, contact, openApps }) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/clients/${c.id}`)}>
                  <TableCell>
                    <Link href={`/clients/${c.id}`} className="font-medium hover:text-primary" onClick={(e) => e.stopPropagation()}>
                      {c.name}
                    </Link>
                    <div className="text-[13px] text-muted-foreground">{c.industry}</div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-nowrap">{contact?.name ?? "—"}</div>
                    <div className="text-[13px] text-muted-foreground">{contact?.title}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">{c.organizationType}</TableCell>
                  <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">{[c.city, c.state].filter(Boolean).join(", ")}</TableCell>
                  <TableCell className="text-center tabular">{openApps}</TableCell>
                  <TableCell className="text-right font-medium tabular">{formatCompactCurrency(c.potentialFunding)}</TableCell>
                  <TableCell>
                    <ClientStatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <ClientFormDialog open={open} onOpenChange={setOpen} onCreated={(id) => router.push(`/clients/${id}`)} />
    </div>
  );
}
