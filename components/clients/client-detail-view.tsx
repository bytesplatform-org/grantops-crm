"use client";
import { useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Award, FileQuestion, FolderKanban, GitCompareArrows, Pencil, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { NotFoundCard } from "@/components/shared/not-found-card";
import { RequestDocumentsDialog } from "@/components/documents/request-documents-dialog";
import { useAppData } from "@/lib/data-service";
import { isActive } from "@/lib/selectors";
import { formatCompactCurrency } from "@/lib/utils";
import { ClientFormDialog } from "./client-form-dialog";
import { ClientOverviewTab } from "./client-overview-tab";
import { ClientFundingTab } from "./client-funding-tab";
import { ClientOpportunitiesTab } from "./client-opportunities-tab";
import { ClientApplicationsTab } from "./client-applications-tab";
import { ClientDocumentsTab } from "./client-documents-tab";
import { ClientContactsTab } from "./client-contacts-tab";

const TABS = [
  ["overview", "Overview"],
  ["funding", "Funding Profile"],
  ["opportunities", "Opportunities"],
  ["applications", "Applications"],
  ["documents", "Documents"],
  ["contacts", "Contacts"],
] as const;

export function ClientDetailView() {
  const { id } = useParams<{ id: string }>();
  const data = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const tab = TABS.some(([k]) => k === params.get("tab")) ? (params.get("tab") as string) : "overview";

  const client = data.clients.find((c) => c.id === id);
  const derived = useMemo(() => {
    const apps = data.applications.filter((a) => a.clientId === id);
    return {
      apps,
      openApps: apps.filter(isActive),
      matches: data.matches.filter((m) => m.clientId === id && m.status !== "Dismissed"),
      awarded: apps.filter((a) => a.status === "Awarded").reduce((s, a) => s + (a.outcome?.amountAwarded ?? a.fundingRequested), 0),
      activities: data.activities.filter((a) => a.clientId === id),
    };
  }, [data, id]);

  if (!client) return <NotFoundCard title="Client not found" href="/clients" label="Back to clients" />;

  const manager = data.team.find((t) => t.id === client.accountManagerId);
  const setTab = (t: string) => router.replace(`${pathname}?tab=${t}`, { scroll: false });
  const requestApp = derived.openApps[0];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-semibold tracking-tight">{client.name}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {[client.organizationType, client.industry, [client.city, client.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
            {manager && ` · Managed by ${manager.name}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit
          </Button>
          <RequestDocumentsDialog
            applicationId={requestApp?.id}
            trigger={
              <Button variant="outline">
                <FileQuestion /> Request Documents
              </Button>
            }
          />
          <Button onClick={() => router.push(`/opportunities?client=${client.id}`)}>
            <Search /> Find Funding
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard highlight label="Potential Funding" value={formatCompactCurrency(client.potentialFunding)} icon={Wallet} />
        <StatCard label="Open Applications" value={derived.openApps.length} icon={FolderKanban} />
        <StatCard label="Matched Opportunities" value={derived.matches.length} icon={GitCompareArrows} />
        <StatCard label="Awarded to Date" value={formatCompactCurrency(derived.awarded)} icon={Award} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map(([k, label]) => (
            <TabsTrigger key={k} value={k}>
              {label}
              {k === "applications" && derived.apps.length > 0 && <span className="text-[12px] text-muted-foreground tabular">{derived.apps.length}</span>}
              {k === "opportunities" && derived.matches.length > 0 && <span className="text-[12px] text-muted-foreground tabular">{derived.matches.length}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <ClientOverviewTab client={client} apps={derived.openApps} activities={derived.activities} />
        </TabsContent>
        <TabsContent value="funding">
          <ClientFundingTab client={client} />
        </TabsContent>
        <TabsContent value="opportunities">
          <ClientOpportunitiesTab client={client} matches={derived.matches} />
        </TabsContent>
        <TabsContent value="applications">
          <ClientApplicationsTab apps={derived.apps} />
        </TabsContent>
        <TabsContent value="documents">
          <ClientDocumentsTab client={client} requestAppId={requestApp?.id} />
        </TabsContent>
        <TabsContent value="contacts">
          <ClientContactsTab client={client} />
        </TabsContent>
      </Tabs>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  );
}
