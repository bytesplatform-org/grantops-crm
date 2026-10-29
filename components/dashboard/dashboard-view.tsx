"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Award, Briefcase, CalendarClock, DollarSign, FolderKanban, GitCompareArrows, Plus, Search } from "lucide-react";
import { useAppData } from "@/lib/data-service";
import { dashboardKpis } from "@/lib/selectors";
import { formatCompactCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { OutcomesDonut, PipelineChart } from "./charts";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { NeedsAttention, attentionItems } from "./needs-attention";
import { MyTasks } from "./my-tasks";
import { WorkflowStrip } from "./workflow-strip";

export function DashboardView() {
  const data = useAppData();
  const k = useMemo(() => dashboardKpis(data), [data]);
  const user = data.team.find((t) => t.id === data.settings.currentUserId);
  const attention = useMemo(() => attentionItems(data).length, [data]);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${greeting()}, ${user?.name.split(" ")[0] ?? "there"}`}
        description={`${today} · Here is your funding operations overview.`}
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
        className="mb-0"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active Clients" value={k.activeClients} change={12} icon={Briefcase} />
        <StatCard label="Active Applications" value={k.activeApplications} change={8} icon={FolderKanban} />
        <StatCard label="Opportunities Matched" value={k.matchedOpportunities} change={23} icon={GitCompareArrows} />
        <StatCard label="Total Funding Pursued" value={formatCompactCurrency(k.fundingPursued)} change={18} icon={DollarSign} />
        <StatCard label="Due This Month" value={k.dueThisMonth} icon={CalendarClock} hint="Next 30 days" />
        <StatCard label="Awards Won" value={formatCompactCurrency(k.awardsWon)} change={31} icon={Award} hint={`${k.awardRate}% award rate`} />
      </div>

      <WorkflowStrip data={data} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Funding Pipeline</CardTitle>
              <CardDescription>Requested funding by application stage</CardDescription>
            </div>
            <Button variant="ghost" size="xs" asChild>
              <Link href="/applications">View pipeline</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <PipelineChart data={data} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Application Outcomes</CardTitle>
              <CardDescription>All applications managed</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <OutcomesDonut data={data} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Active applications by submission deadline</CardDescription>
            </div>
            <Button variant="ghost" size="xs" asChild>
              <Link href="/tasks">Calendar</Link>
            </Button>
          </CardHeader>
          <UpcomingDeadlines data={data} limit={6} />
        </Card>
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                Needs Attention
                {attention > 0 && <span className="rounded-full bg-red-50 px-1.5 text-[11px] font-semibold text-red-600">{attention}</span>}
              </CardTitle>
              <CardDescription>Items blocking submission readiness</CardDescription>
            </div>
          </CardHeader>
          <NeedsAttention data={data} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-border pb-3">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Assigned to you, by due date</CardDescription>
            </div>
            <Button variant="ghost" size="xs" asChild>
              <Link href="/tasks">All tasks</Link>
            </Button>
          </CardHeader>
          <MyTasks data={data} />
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Across all clients and applications</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={data.activities} limit={8} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
