"use client";
import { useMemo } from "react";
import { Award, Briefcase, DollarSign, Download, Percent, Radar, Scale } from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/lib/data-service";
import { dashboardKpis } from "@/lib/selectors";
import { formatCompactCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { OutcomesDonut, PipelineChart } from "@/components/dashboard/charts";
import { AgencyChart, DeadlineWeeksChart } from "./report-charts";
import { ClientPortfolio } from "./client-portfolio";
import { ApplicationsAtRisk, TopOpportunities } from "./report-lists";
import { downloadApplicationsCsv } from "./export-csv";

export function ReportsView() {
  const data = useAppData();
  const k = useMemo(() => dashboardKpis(data), [data]);
  const nonWithdrawn = data.applications.filter((a) => a.status !== "Withdrawn");
  const avg = nonWithdrawn.length ? nonWithdrawn.reduce((s, a) => s + a.fundingRequested, 0) / nonWithdrawn.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Portfolio performance, pipeline health, and funding outcomes."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => {
                downloadApplicationsCsv(data);
                toast.success("Export ready", { description: `${data.applications.length} applications exported to CSV.` });
              }}
            >
              <Download /> Export CSV
            </Button>
          </>
        }
        className="mb-0"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Funding Identified" value={formatCompactCurrency(k.fundingIdentified)} change={27} icon={Radar} hint="Award ceilings of open matches" />
        <StatCard label="Total Funding Pursued" value={formatCompactCurrency(k.fundingPursued)} change={18} icon={DollarSign} />
        <StatCard label="Total Funding Awarded" value={formatCompactCurrency(k.awardsWon)} change={31} icon={Award} />
        <StatCard label="Award Rate" value={`${k.awardRate}%`} change={6} icon={Percent} hint="Of decided applications" />
        <StatCard label="Avg. Application Value" value={formatCompactCurrency(avg)} change={4} icon={Scale} />
        <StatCard label="Active Clients" value={k.activeClients} change={12} icon={Briefcase} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Funding by Agency</CardTitle>
              <CardDescription>Requested funding across all applications</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AgencyChart data={data} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Application Outcome</CardTitle>
              <CardDescription>Decisions and pending submissions</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <OutcomesDonut data={data} height={180} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pipeline by Stage</CardTitle>
              <CardDescription>Requested funding by stage</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <PipelineChart data={data} height={220} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming Funding Deadlines</CardTitle>
              <CardDescription>Active requests due in the next 60 days, by week</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DeadlineWeeksChart data={data} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <div>
              <CardTitle>Top Opportunities</CardTitle>
              <CardDescription>Highest-scoring matches not yet pursued</CardDescription>
            </div>
          </CardHeader>
          <TopOpportunities data={data} />
        </Card>
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <div>
              <CardTitle>Applications at Risk</CardTitle>
              <CardDescription>Risk flags, missing requirements, or tight timelines</CardDescription>
            </div>
          </CardHeader>
          <ApplicationsAtRisk data={data} />
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <div>
            <CardTitle>Client Portfolio</CardTitle>
            <CardDescription>Pursued and awarded funding by client</CardDescription>
          </div>
        </CardHeader>
        <ClientPortfolio data={data} />
      </Card>
    </div>
  );
}
