"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Briefcase, CalendarClock, FolderKanban, Plus, Search } from "lucide-react";
import { useAppData } from "@/lib/data-service";
import { dashboardKpis } from "@/lib/selectors";
import { formatCompactCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { NeedsAttention, attentionItems } from "./needs-attention";
import { RecentActivity } from "./recent-activity";
import { PipelineTrend } from "./pipeline-trend";
import { StageChart } from "./stage-chart";
import { Gauge, MiniBars, Sparkline } from "./mini-charts";
import { kpiTrends } from "./dashboard-metrics";

export function DashboardView() {
  const data = useAppData();
  const k = useMemo(() => dashboardKpis(data), [data]);
  const t = useMemo(() => kpiTrends(data), [data]);
  const user = data.team.find((m) => m.id === data.settings.currentUserId);
  const attention = useMemo(() => attentionItems(data).length, [data]);
  const decided = data.applications.filter((a) => a.status === "Awarded" || a.status === "Not Awarded").length;
  const awarded = data.applications.filter((a) => a.status === "Awarded").length;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Good ${greeting()}, ${user?.name.split(" ")[0] ?? "there"} · ${today}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/opportunities">
                <Search /> Find Funding
              </Link>
            </Button>
            <Button asChild>
              <Link href="/matches">
                <Plus /> New Application
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlight
          label="Funding Pursued"
          value={formatCompactCurrency(k.fundingPursued)}
          trend={{ value: `+${formatCompactCurrency(t.fundingAdded30)}`, label: "in 30d", direction: t.fundingAdded30 ? "up" : "neutral" }}
          chart={<MiniBars values={t.fundingBars} />}
        />
        <StatCard
          label="Active Applications"
          value={k.activeApplications}
          icon={FolderKanban}
          trend={{ value: `+${t.appsOpened30}`, label: "this month", direction: t.appsOpened30 ? "up" : "neutral" }}
          chart={<Sparkline values={t.appsSpark} color="#2563eb" />}
        />
        <StatCard
          label="Active Clients"
          value={k.activeClients}
          icon={Briefcase}
          trend={{ value: `${t.onboarding}`, label: "onboarding", direction: "neutral" }}
          chart={
            <div className="text-center">
              <Gauge value={t.clientCoverage} />
              <div className="text-[10px] text-muted-foreground">with open apps</div>
            </div>
          }
        />
        <StatCard
          label="Due This Month"
          value={k.dueThisMonth}
          icon={CalendarClock}
          iconTone="rose"
          trend={{ value: `${t.dueNext7}`, label: "next 7 days", direction: "neutral" }}
          chart={<Sparkline values={t.dueByWeek} color="#e11d48" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
        <PipelineTrend data={data} />
        <Card className="min-w-0">
          <CardHeader className="items-center">
            <CardTitle>Upcoming Deadlines</CardTitle>
            <ViewAll href="/applications" />
          </CardHeader>
          <UpcomingDeadlines data={data} limit={6} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,4fr)]">
        <Card className="min-w-0 lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <RecentActivity data={data} limit={5} />
        </Card>
        <StageChart data={data} awardRate={k.awardRate} decided={decided} awarded={awarded} />
        <Card className="min-w-0">
          <CardHeader className="items-center">
            <CardTitle className="flex items-center gap-2">
              Needs Attention
              {attention > 0 && (
                <span className="rounded-full bg-dark px-2 text-[12px] font-medium leading-5 text-white tabular">{attention}</span>
              )}
            </CardTitle>
          </CardHeader>
          <NeedsAttention data={data} />
        </Card>
      </div>
    </div>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>
        View All <ArrowRight />
      </Link>
    </Button>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
