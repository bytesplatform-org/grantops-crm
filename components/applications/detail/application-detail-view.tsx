"use client";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileStack, LayoutGrid, PenLine, Send, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotFoundCard } from "@/components/shared/not-found-card";
import { complianceSummary } from "@/lib/selectors";
import { useApplication } from "./use-application";
import { DetailHeader } from "./detail-header";
import { OverviewTab } from "./overview-tab";
import { WritingTab } from "./writing-tab";
import { DocumentsTab } from "./documents-tab";
import { BudgetBuilder } from "./budget-builder";
import { SubmissionTab } from "./submission-tab";

const TABS = ["overview", "writing", "documents", "budget", "submission"] as const;
/** Older links (notifications, seed data) still point at tabs that were merged. */
const ALIASES: Record<string, (typeof TABS)[number]> = { requirements: "documents", reviews: "overview", activity: "overview", submit: "submission" };

export function ApplicationDetailView() {
  const { id } = useParams<{ id: string }>();
  const ctx = useApplication(id);
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabParam = search.get("tab") ?? "";
  const tab = TABS.includes(tabParam as (typeof TABS)[number]) ? tabParam : (ALIASES[tabParam] ?? "overview");

  if (!ctx) return <NotFoundCard title="Application not found" href="/applications" label="Back to applications" />;
  const { app } = ctx;
  const cs = complianceSummary(app);

  const setTab = (t: string) => {
    const next = ALIASES[t] ?? t;
    const p = new URLSearchParams(search.toString());
    if (next === "overview") p.delete("tab");
    else p.set("tab", next);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const count = (n: number) => (n ? <span className="rounded bg-red-50 px-1.5 text-[11px] font-medium text-red-700 tabular">{n}</span> : null);

  return (
    <div className="space-y-6">
      <DetailHeader ctx={ctx} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview"><LayoutGrid /> Overview</TabsTrigger>
          <TabsTrigger value="writing"><PenLine /> Writing</TabsTrigger>
          <TabsTrigger value="documents"><FileStack /> Documents {count(cs.missing)}</TabsTrigger>
          <TabsTrigger value="budget"><Wallet /> Budget</TabsTrigger>
          <TabsTrigger value="submission"><Send /> Submit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab ctx={ctx} onNavigate={setTab} /></TabsContent>
        <TabsContent value="writing"><WritingTab ctx={ctx} /></TabsContent>
        <TabsContent value="documents"><DocumentsTab ctx={ctx} /></TabsContent>
        <TabsContent value="budget"><BudgetBuilder ctx={ctx} /></TabsContent>
        <TabsContent value="submission"><SubmissionTab ctx={ctx} onNavigate={setTab} /></TabsContent>
      </Tabs>
    </div>
  );
}
