"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, PenLine, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { MemberAvatar } from "@/components/shared/avatar";
import { Deadline } from "@/components/shared/deadline";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { useAppData } from "@/lib/data-service";
import { isActive } from "@/lib/selectors";
import { wordCount } from "@/lib/utils";
import { STATUS_DOT } from "./section-nav";

export function WritingIndex() {
  const data = useAppData();
  const [q, setQ] = useState("");
  const apps = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.applications
      .filter(isActive)
      .map((a) => ({ a, opp: data.opportunities.find((o) => o.id === a.opportunityId), client: data.clients.find((c) => c.id === a.clientId) }))
      .filter(({ opp, client }) => !term || opp?.title.toLowerCase().includes(term) || client?.name.toLowerCase().includes(term))
      .sort((x, y) => +new Date(x.a.deadline) - +new Date(y.a.deadline));
  }, [data, q]);

  return (
    <>
      <PageHeader
        title="Writing Workspace"
        description="Draft, refine, and check every narrative section against NOFO requirements."
        actions={
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search applications…" className="pl-8" />
          </div>
        }
      />
      {apps.length === 0 ? (
        <EmptyState icon={PenLine} title="No active applications" description="Approve a pursuit from Matches to create an application workspace." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map(({ a, opp, client }) => {
            const complete = a.sections.filter((s) => s.status === "Complete").length;
            const words = a.sections.reduce((s, x) => s + wordCount(x.content), 0);
            const next = a.sections.find((s) => s.status !== "Complete");
            return (
              <Link key={a.id} href={`/applications/${a.id}/writing${next ? `?section=${next.key}` : ""}`} className="group">
                <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{opp?.agency}</div>
                      <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">{opp?.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{client?.name}</div>
                    </div>
                    <ApplicationStatusBadge status={a.status} />
                  </div>
                  <div className="mt-4 flex gap-1">
                    {a.sections.map((s) => (
                      <span key={s.id} className={`h-1.5 flex-1 rounded-full ${STATUS_DOT[s.status]}`} title={`${s.title}: ${s.status}`} />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground tabular">{complete}/{a.sections.length}</span> sections complete
                    </span>
                    <span className="text-muted-foreground tabular">{words.toLocaleString()} words</span>
                  </div>
                  <Progress value={(complete / a.sections.length) * 100} className="mt-2" indicatorClassName="bg-emerald-500" />
                  <div className="mt-auto flex items-end justify-between pt-4">
                    <Deadline date={a.deadline} />
                    <div className="flex items-center gap-2">
                      <MemberAvatar id={a.writerId} />
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        {next ? `Continue: ${next.title}` : "Review"} <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
