"use client";
import Link from "next/link";
import { ArrowUpRight, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MemberAvatar } from "@/components/shared/avatar";
import { SectionStatusBadge } from "@/components/shared/status-badge";
import { cn, relativeTime, wordCount } from "@/lib/utils";
import type { AppContext } from "./use-application";

export function WritingTab({ ctx }: { ctx: AppContext }) {
  const { app } = ctx;
  const complete = app.sections.filter((s) => s.status === "Complete").length;
  const words = app.sections.reduce((s, x) => s + wordCount(x.content), 0);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{complete} of {app.sections.length}</span> sections complete · {words.toLocaleString()} words drafted
        </div>
        <Button asChild>
          <Link href={`/applications/${app.id}/writing`}>
            <PenLine /> Open Writing Workspace
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {app.sections.map((s) => {
          const wc = wordCount(s.content);
          const pct = Math.min(100, (wc / s.wordLimit) * 100);
          return (
            <Card key={s.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold">{s.title}</div>
                <SectionStatusBadge status={s.status} />
              </div>
              <p className="mt-2 line-clamp-2 min-h-8 text-xs text-muted-foreground">{s.content || s.requirement}</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Words</span>
                  <span className={cn("tabular", wc > s.wordLimit && "font-semibold text-red-600")}>{wc} / {s.wordLimit}</span>
                </div>
                <Progress value={pct} indicatorClassName={wc > s.wordLimit ? "bg-red-500" : s.status === "Complete" ? "bg-emerald-500" : undefined} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <MemberAvatar id={s.assigneeId} size="xs" />
                  {s.content ? `Updated ${relativeTime(s.updatedAt)}` : "Not started"}
                </div>
                <Button variant="ghost" size="xs" asChild>
                  <Link href={`/applications/${app.id}/writing?section=${s.key}`}>
                    Open <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
