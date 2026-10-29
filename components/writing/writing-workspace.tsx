"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NotFoundCard } from "@/components/shared/not-found-card";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { updateSection, useAppData } from "@/lib/data-service";
import { SectionNav } from "./section-nav";
import { SectionEditor } from "./section-editor";
import { ContextPanel } from "./context-panel";

export function WritingWorkspace() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const data = useAppData();
  const app = data.applications.find((a) => a.id === id);
  const [live, setLive] = useState<{ id: string; text: string } | null>(null);

  if (!app) return <NotFoundCard title="Application not found" href="/writing" label="Back to Writing Workspace" />;

  const client = data.clients.find((c) => c.id === app.clientId);
  const opportunity = data.opportunities.find((o) => o.id === app.opportunityId);
  const key = params.get("section");
  const idx = Math.max(0, app.sections.findIndex((s) => s.key === key));
  const section = app.sections[idx];
  if (!section) return <NotFoundCard title="No sections for this application" href={`/applications/${app.id}`} label="Back to application" />;

  const go = (i: number) => {
    const s = app.sections[i];
    if (s) router.replace(`${pathname}?section=${s.key}`, { scroll: false });
  };
  const liveText = live?.id === section.id ? live.text : section.content;

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100vh-7.25rem)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/applications/${app.id}`}>
              <ArrowLeft /> Application
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight">Writing Workspace</h1>
              <ApplicationStatusBadge status={app.status} />
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {opportunity?.title} · {client?.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => go(idx - 1)}>
            <ChevronLeft /> Previous
          </Button>
          <span className="px-1 text-xs text-muted-foreground tabular">
            {idx + 1} / {app.sections.length}
          </span>
          <Button variant="outline" size="sm" disabled={idx === app.sections.length - 1} onClick={() => go(idx + 1)}>
            Next <ChevronRight />
          </Button>
          <Button
            variant="success"
            size="sm"
            disabled={section.status === "Complete" || !liveText.trim()}
            onClick={() => {
              updateSection(app.id, section.id, { status: "Complete", content: liveText }, { log: `${section.title} marked Complete.` });
              toast.success(`${section.title} marked complete`);
              if (idx < app.sections.length - 1) go(idx + 1);
            }}
          >
            <CheckCircle2 /> Mark Complete
          </Button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[264px_minmax(0,1fr)_320px]">
        <Card className="min-h-0 overflow-hidden">
          <SectionNav app={app} client={client} opportunity={opportunity} activeId={section.id} onSelect={(s) => go(app.sections.indexOf(s))} />
        </Card>
        <div className="min-h-0 overflow-y-auto scrollbar-thin">
          <SectionEditor key={section.id} app={app} section={section} onTextChange={(text) => setLive({ id: section.id, text })} />
        </div>
        <Card className="min-h-0 overflow-hidden">
          <ContextPanel app={app} section={section} liveText={liveText} />
        </Card>
      </div>
    </div>
  );
}
