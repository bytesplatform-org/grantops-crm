"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { InfoGrid, TagList } from "@/components/shared/info-row";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { Deadline } from "@/components/shared/deadline";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppData } from "@/lib/data-service";
import { applicationCompletion } from "@/lib/selectors";
import type { Activity, Application, Client } from "@/lib/types";
import { formatCompactCurrency } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export function ClientOverviewTab({ client, apps, activities }: { client: Client; apps: Application[]; activities: Activity[] }) {
  const data = useAppData();
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-relaxed text-slate-700">{client.summary || "No summary yet."}</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">Funding priorities</h4>
                <ul className="space-y-1.5 text-sm">
                  {client.fundingProfile.objectives.map((o) => (
                    <li key={o} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" /> {o}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">Capabilities</h4>
                <ul className="space-y-1.5 text-sm">
                  {client.capabilities.length ? (
                    client.capabilities.map((o) => (
                      <li key={o} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" /> {o}
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">Not documented yet.</li>
                  )}
                </ul>
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">Service areas</h4>
              <TagList items={client.serviceAreas} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organization details</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoGrid
              items={[
                { label: "Year founded", value: client.yearFounded },
                { label: "Employees", value: client.employees || "—" },
                { label: "Annual revenue", value: client.annualRevenue },
                { label: "Website", value: client.website || "—" },
                { label: "SAM.gov status", value: <span className={client.samRegistration === "Active" ? "text-emerald-700" : "text-amber-700"}>{client.samRegistration}</span> },
                { label: "NAICS", value: client.naics.join(", ") || "—" },
                { label: "Service area", value: client.serviceArea || "—" },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current applications</CardTitle>
            <Link href={`/clients/${client.id}?tab=applications`} className="text-[13px] font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!apps.length && <EmptyState icon={FolderKanban} title="No open applications" description="Use Find Funding to identify potential matches." />}
            {apps.map((a) => {
              const opp = data.opportunities.find((o) => o.id === a.opportunityId);
              const pct = applicationCompletion(a);
              return (
                <Link key={a.id} href={`/applications/${a.id}`} className="group flex items-center gap-4 rounded-md border border-border p-3 hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium group-hover:text-primary">{opp?.title}</div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {opp?.agency} · {formatCompactCurrency(a.fundingRequested)}
                    </div>
                  </div>
                  <ApplicationStatusBadge status={a.status} />
                  <div className="hidden w-28 sm:block">
                    <div className="mb-1 text-right text-[11px] font-medium tabular">{pct}%</div>
                    <Progress value={pct} />
                  </div>
                  <Deadline date={a.deadline} compact className="hidden w-24 md:inline-flex" />
                  <ArrowRight className="size-4 text-slate-300 group-hover:text-primary" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityFeed items={activities} limit={12} showContext={false} />
        </CardContent>
      </Card>
    </div>
  );
}
