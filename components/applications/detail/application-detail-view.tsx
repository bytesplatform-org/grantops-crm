"use client";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, ClipboardList, FileStack, LayoutGrid, MessageSquare, PenLine, Send, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { NotFoundCard } from "@/components/shared/not-found-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { complianceSummary } from "@/lib/selectors";
import { useApplication } from "./use-application";
import { DetailHeader } from "./detail-header";
import { OverviewTab } from "./overview-tab";
import { WritingTab } from "./writing-tab";
import { ComplianceMatrix } from "./compliance-matrix";
import { DocumentsTab } from "./documents-tab";
import { BudgetBuilder } from "./budget-builder";
import { ReviewsTab } from "./reviews-tab";
import { SubmissionTab } from "./submission-tab";

const TABS = ["overview", "writing", "requirements", "documents", "budget", "reviews", "submission", "activity"] as const;

export function ApplicationDetailView() {
  const { id } = useParams<{ id: string }>();
  const ctx = useApplication(id);
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = search.get("tab");
  const tab = TABS.includes(tabParam as (typeof TABS)[number]) ? (tabParam as string) : "overview";

  if (!ctx) return <NotFoundCard title="Application not found" href="/applications" label="Back to applications" />;
  const { app, data } = ctx;
  const cs = complianceSummary(app);
  const openComments = ctx.reviews.reduce((s, r) => s + r.comments.filter((c) => !c.resolved).length, 0);
  const activities = data.activities.filter((a) => a.applicationId === app.id);

  const setTab = (t: string) => {
    const p = new URLSearchParams(search.toString());
    if (t === "overview") p.delete("tab");
    else p.set("tab", t);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const count = (n: number) => (n ? <span className="rounded bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground tabular">{n}</span> : null);

  return (
    <div>
      <DetailHeader ctx={ctx} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview"><LayoutGrid /> Overview</TabsTrigger>
          <TabsTrigger value="writing"><PenLine /> Writing</TabsTrigger>
          <TabsTrigger value="requirements"><ClipboardList /> Requirements {count(cs.missing)}</TabsTrigger>
          <TabsTrigger value="documents"><FileStack /> Documents</TabsTrigger>
          <TabsTrigger value="budget"><Wallet /> Budget</TabsTrigger>
          <TabsTrigger value="reviews"><MessageSquare /> Reviews {count(openComments)}</TabsTrigger>
          <TabsTrigger value="submission"><Send /> Submission</TabsTrigger>
          <TabsTrigger value="activity"><Activity /> Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab ctx={ctx} onNavigate={setTab} /></TabsContent>
        <TabsContent value="writing"><WritingTab ctx={ctx} /></TabsContent>
        <TabsContent value="requirements"><ComplianceMatrix ctx={ctx} /></TabsContent>
        <TabsContent value="documents"><DocumentsTab ctx={ctx} /></TabsContent>
        <TabsContent value="budget"><BudgetBuilder ctx={ctx} /></TabsContent>
        <TabsContent value="reviews"><ReviewsTab ctx={ctx} /></TabsContent>
        <TabsContent value="submission"><SubmissionTab ctx={ctx} onNavigate={setTab} /></TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-5">
              <ActivityFeed items={activities} limit={50} showContext={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
