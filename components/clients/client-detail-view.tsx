"use client";
import { useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Award, FileQuestion, FolderKanban, GitCompareArrows, MapPin, Pencil, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { MemberAvatar } from "@/components/shared/avatar";
import { NotFoundCard } from "@/components/shared/not-found-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { RequestDocumentsDialog } from "@/components/documents/request-documents-dialog";
import { primaryContact, useAppData } from "@/lib/data-service";
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
  ["activity", "Activity"],
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

  const contact = primaryContact(data, client.id);
  const manager = data.team.find((t) => t.id === client.accountManagerId);
  const setTab = (t: string) => router.replace(`${pathname}?tab=${t}`, { scroll: false });
  const requestApp = derived.openApps[0];

  return (
    <div>
      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-base font-semibold text-white">
              {client.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{client.name}</h1>
                <ClientStatusBadge status={client.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{client.organizationType}</span>
                <span className="text-slate-300">•</span>
                <span>{client.industry}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {[client.city, client.state].filter(Boolean).join(", ")}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {client.certifications.map((c) => (
                  <Badge key={c} variant="info">
                    {c}
                  </Badge>
                ))}
                {client.naics.map((n) => (
                  <Badge key={n} variant="outline">
                    NAICS {n}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {contact && (
                  <span>
                    Primary contact: <span className="font-medium text-foreground">{contact.name}</span>, {contact.title}
                  </span>
                )}
                {manager && (
                  <span className="inline-flex items-center gap-1.5">
                    Account manager: <MemberAvatar id={manager.id} size="xs" /> <span className="font-medium text-foreground">{manager.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil /> Edit Client
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
      </Card>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Potential Funding" value={formatCompactCurrency(client.potentialFunding)} icon={Wallet} hint={`Target ${formatCompactCurrency(client.fundingProfile.targetAmount)}`} />
        <StatCard label="Open Applications" value={derived.openApps.length} icon={FolderKanban} hint={`${formatCompactCurrency(derived.openApps.reduce((s, a) => s + a.fundingRequested, 0))} requested`} />
        <StatCard label="Matched Opportunities" value={derived.matches.length} icon={GitCompareArrows} hint={`${derived.matches.filter((m) => m.recommendation === "Pursue").length} recommended to pursue`} />
        <StatCard label="Awarded to Date" value={formatCompactCurrency(derived.awarded)} icon={Award} hint="Through this engagement" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map(([k, label]) => (
            <TabsTrigger key={k} value={k}>
              {label}
              {k === "applications" && derived.apps.length > 0 && <span className="rounded bg-muted px-1.5 text-[10px] tabular">{derived.apps.length}</span>}
              {k === "opportunities" && derived.matches.length > 0 && <span className="rounded bg-muted px-1.5 text-[10px] tabular">{derived.matches.length}</span>}
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
        <TabsContent value="activity">
          <Card className="p-5">
            <ActivityFeed items={derived.activities} limit={100} showContext={false} />
          </Card>
        </TabsContent>
      </Tabs>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} />
    </div>
  );
}
