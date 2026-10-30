"use client";
import Link from "next/link";
import { CheckCircle2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deadlineTone } from "@/components/shared/deadline";
import { setApplicationStatus } from "@/lib/data-service";
import { cn, daysLeftLabel, formatCurrency, formatDate } from "@/lib/utils";
import { StatusMenu } from "../list/status-menu";
import { WorkflowStepper } from "./workflow-stepper";
import type { AppContext } from "./use-application";

const PRE_READY = ["Researching", "Eligibility Confirmed", "Preparing", "Writing", "Internal Review", "Client Review"];

export function DetailHeader({ ctx }: { ctx: AppContext }) {
  const { app, opp, client } = ctx;
  const closed = ["Submitted", "Awarded", "Not Awarded", "Withdrawn"].includes(app.status);
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight">{opp?.title ?? "Application"}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
            <Link href={`/clients/${app.clientId}`} className="font-medium text-primary hover:underline">
              {client?.name}
            </Link>
            {opp && (
              <>
                <span className="text-zinc-300">·</span>
                <Link href={`/opportunities/${opp.id}`} className="hover:text-foreground hover:underline">
                  {opp.agency}
                </Link>
              </>
            )}
            <span className="text-zinc-300">·</span>
            <span className="font-medium text-foreground tabular">{formatCurrency(app.fundingRequested)}</span>
            <span className="text-zinc-300">·</span>
            <span>
              Due {formatDate(app.deadline)}
              {!closed && <span className={cn("ml-1", deadlineTone(app.deadline))}>({daysLeftLabel(app.deadline)})</span>}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusMenu app={app} />
          <Button variant="outline" asChild>
            <Link href={`/applications/${app.id}/writing`}>
              <PenLine /> Writing Workspace
            </Link>
          </Button>
          {PRE_READY.includes(app.status) && (
            <Button
              onClick={() => {
                setApplicationStatus(app.id, "Ready to Submit");
                toast.success("Marked Ready to Submit", { description: "Proceed to Submit when final checks are complete." });
              }}
            >
              <CheckCircle2 /> Mark Ready to Submit
            </Button>
          )}
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <WorkflowStepper status={app.status} />
      </div>
    </Card>
  );
}
