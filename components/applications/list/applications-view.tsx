"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, FolderKanban, Gauge, Kanban, Plus, Rows3, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, SegmentedList, SegmentedTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppData } from "@/lib/data-service";
import { isActive } from "@/lib/selectors";
import { APPLICATION_STATUSES } from "@/lib/types";
import { daysUntil, formatCompactCurrency } from "@/lib/utils";
import { useApplicationRows } from "./use-application-rows";
import { KanbanBoard } from "./kanban-board";
import { ApplicationsTable } from "./applications-table";

export function ApplicationsView() {
  const data = useAppData();
  const rows = useApplicationRows(data);
  const [view, setView] = useState<string>(data.settings.defaultApplicationView);
  const [q, setQ] = useState("");
  const [client, setClient] = useState("");
  const [agency, setAgency] = useState("");
  const [writer, setWriter] = useState("");
  const [status, setStatus] = useState("");

  const agencies = useMemo(() => [...new Set(data.opportunities.map((o) => o.agency))].sort(), [data.opportunities]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows
      .filter((r) => !t || r.opp?.title.toLowerCase().includes(t) || r.client?.name.toLowerCase().includes(t) || r.opp?.opportunityNumber.toLowerCase().includes(t))
      .filter((r) => !client || r.app.clientId === client)
      .filter((r) => !agency || r.opp?.agency === agency)
      .filter((r) => !writer || r.app.writerId === writer)
      .filter((r) => !status || r.app.status === status)
      .sort((a, b) => +new Date(a.app.deadline) - +new Date(b.app.deadline));
  }, [rows, q, client, agency, writer, status]);

  const active = rows.filter((r) => isActive(r.app));
  const pipeline = active.reduce((s, r) => s + r.app.fundingRequested, 0);
  const due = active.filter((r) => {
    const d = daysUntil(r.app.deadline);
    return d >= 0 && d <= 30;
  }).length;
  const avg = active.length ? Math.round(active.reduce((s, r) => s + r.completion, 0) / active.length) : 0;
  const hasFilters = q || client || agency || writer || status;

  return (
    <Tabs value={view} onValueChange={setView}>
      <PageHeader
        title="Applications"
        description="Grant pipeline from eligibility through submission handoff and outcome."
        actions={
          <>
            <SegmentedList>
              <SegmentedTrigger value="kanban">
                <Kanban /> Kanban
              </SegmentedTrigger>
              <SegmentedTrigger value="table">
                <Rows3 /> Table
              </SegmentedTrigger>
            </SegmentedList>
            <Button asChild>
              <Link href="/matches">
                <Plus /> New Application
              </Link>
            </Button>
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Applications" value={active.length} icon={FolderKanban} hint={`${rows.length} total in workspace`} />
        <StatCard label="Active Pipeline Value" value={formatCompactCurrency(pipeline)} icon={Wallet} hint="Federal funding requested" />
        <StatCard label="Due in Next 30 Days" value={due} icon={CalendarClock} hint="Active applications" />
        <StatCard label="Avg. Completion" value={`${avg}%`} icon={Gauge} hint="Across active applications" />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search grant, client, number…" className="pl-9" />
        </div>
        <Select value={client} onChange={(e) => setClient(e.target.value)} className="w-48" aria-label="Client">
          <option value="">All clients</option>
          {data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={agency} onChange={(e) => setAgency(e.target.value)} className="w-48" aria-label="Agency">
          <option value="">All agencies</option>
          {agencies.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Select>
        <Select value={writer} onChange={(e) => setWriter(e.target.value)} className="w-40" aria-label="Writer">
          <option value="">All writers</option>
          {data.team.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44" aria-label="Status">
          <option value="">All statuses</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setClient(""); setAgency(""); setWriter(""); setStatus(""); }}>
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} applications</span>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No applications match your filters" description="Adjust filters or start a new application from a qualified match." />
      ) : (
        <>
          <TabsContent value="kanban" className="pt-0">
            <KanbanBoard rows={filtered} />
            <p className="mt-1 text-xs text-muted-foreground">Drag cards between columns, or use the status menu on each card to change stage.</p>
          </TabsContent>
          <TabsContent value="table" className="pt-0">
            <ApplicationsTable rows={filtered} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
