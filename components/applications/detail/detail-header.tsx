"use client";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ExternalLink, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/shared/status-badge";
import { ScoreRing } from "@/components/shared/score-ring";
import { deadlineTone } from "@/components/shared/deadline";
import { setApplicationStatus } from "@/lib/data-service";
import { applicationCompletion } from "@/lib/selectors";
import { cn, daysLeftLabel, formatCurrency, formatDate } from "@/lib/utils";
import { StatusMenu } from "../list/status-menu";
import { WorkflowStepper } from "./workflow-stepper";
import type { AppContext } from "./use-application";

const PRE_READY = ["Researching", "Eligibility Confirmed", "Preparing", "Writing", "Internal Review", "Client Review"];

export function DetailHeader({ ctx }: { ctx: AppContext }) {
  const { app, opp, client } = ctx;
  const completion = applicationCompletion(app);
  const closed = ["Submitted", "Awarded", "Not Awarded", "Withdrawn"].includes(app.status);
  return (
    <Card className="mb-5 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-slate-600">{opp?.agency}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono">{opp?.opportunityNumber}</span>
            {opp?.isDemo && <DemoBadge />}
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{opp?.title ?? "Application"}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            Client:{" "}
            <Link href={`/clients/${app.clientId}`} className="font-medium text-primary hover:underline">
              {client?.name}
            </Link>
            {opp && (
              <>
                {" · "}
                <Link href={`/opportunities/${opp.id}?tab=nofo`} className="hover:text-foreground hover:underline">
                  View NOFO analysis <ExternalLink className="inline size-3" />
                </Link>
              </>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Funding request</div>
              <div className="text-lg font-semibold tabular">{formatCurrency(app.fundingRequested)}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Deadline</div>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <CalendarClock className="size-3.5 text-muted-foreground" />
                {formatDate(app.deadline)}
                {!closed && <span className={cn("text-xs", deadlineTone(app.deadline))}>· {daysLeftLabel(app.deadline)}</span>}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</div>
              <StatusMenu app={app} className="mt-0.5" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-3">
            <ScoreRing score={completion} size={64} />
            <div className="text-xs text-muted-foreground">
              <div className="font-medium text-foreground">Completion</div>
              <div>Checklist, sections & compliance</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <WorkflowStepper status={app.status} />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/applications/${app.id}/writing`}>
              <PenLine /> Open Writing Workspace
            </Link>
          </Button>
          {PRE_READY.includes(app.status) && (
            <Button
              onClick={() => {
                setApplicationStatus(app.id, "Ready to Submit");
                toast.success("Marked Ready to Submit", { description: "Proceed to Submission Handoff when final checks are complete." });
              }}
            >
              <CheckCircle2 /> Mark Ready to Submit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
