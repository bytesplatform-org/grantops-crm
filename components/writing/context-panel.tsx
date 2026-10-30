"use client";
import Link from "next/link";
import { BookOpenCheck, FileText, Lightbulb, MessageSquare, Quote } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MemberAvatar } from "@/components/shared/avatar";
import { RequestDocumentsDialog } from "@/components/documents/request-documents-dialog";
import { useAppData } from "@/lib/data-service";
import type { Application, ApplicationSection } from "@/lib/types";
import { cn, wordCount } from "@/lib/utils";

function Block({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-4 py-3 last:border-0">
      <h3 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
        <Icon className="size-3" /> {title}
      </h3>
      {children}
    </section>
  );
}

export function ContextPanel({ app, section, liveText }: { app: Application; section: ApplicationSection; liveText: string }) {
  const data = useAppData();
  const words = wordCount(liveText);
  const pct = (words / section.wordLimit) * 100;
  const clientDocs = data.documents.filter((d) => d.clientId === app.clientId);
  const findDoc = (evidence: string) => {
    const tokens = evidence.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3);
    return clientDocs.find((d) => {
      const name = d.name.toLowerCase().replace(/[_\-.]+/g, " ");
      return tokens.length > 0 && tokens.every((t) => name.includes(t.replace(/s$/, "")));
    });
  };
  const comments = data.reviews
    .filter((r) => r.applicationId === app.id)
    .flatMap((r) => r.comments.filter((c) => c.sectionTitle === section.title && !c.resolved).map((c) => ({ ...c, reviewType: r.type })));

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <Block icon={Quote} title="NOFO requirement">
        <blockquote className="border-l-2 border-zinc-300 py-0.5 pl-3 text-[13px] leading-relaxed text-zinc-700">“{section.requirement}”</blockquote>
      </Block>
      <Block icon={Lightbulb} title="Guidance">
        <p className="text-[13px] leading-relaxed text-slate-700">{section.guidance}</p>
      </Block>
      <Block icon={BookOpenCheck} title="Client evidence">
        <ul className="space-y-1.5">
          {section.evidence.map((e) => {
            const doc = findDoc(e);
            return (
              <li key={e} className="flex items-center gap-2 text-[13px]">
                <FileText className={cn("size-3.5 shrink-0", doc ? "text-emerald-600" : "text-slate-400")} />
                <span className="min-w-0 flex-1 truncate">{e}</span>
                {doc ? (
                  <Link href={`/documents?q=${encodeURIComponent(doc.name)}`} className="shrink-0 text-xs font-medium text-primary hover:underline">
                    View
                  </Link>
                ) : (
                  <RequestDocumentsDialog
                    applicationId={app.id}
                    trigger={<button className="shrink-0 text-xs font-medium text-amber-700 hover:underline">Request</button>}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Block>
      <Block icon={FileText} title="Word limit">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className={cn("text-[15px] font-medium tabular", pct > 100 && "text-red-600")}>{words.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">of {section.wordLimit.toLocaleString()} words</span>
        </div>
        <Progress value={pct} indicatorClassName={pct > 100 ? "bg-red-500" : pct > 85 ? "bg-amber-500" : "bg-primary"} />
        {pct > 100 && <p className="mt-1.5 text-xs text-red-600">Over limit by {(words - section.wordLimit).toLocaleString()} words.</p>}
      </Block>
      <Block icon={MessageSquare} title={`Reviewer comments (${comments.length})`}>
        {comments.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No open comments on this section.</p>
        ) : (
          <ul className="space-y-2.5">
            {comments.map((c) => (
              <li key={c.id} className="rounded-md border border-amber-200 bg-amber-50/60 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MemberAvatar id={c.authorId} size="xs" />
                  <span className="font-medium text-foreground">{c.authorName}</span>
                  <span>· {c.reviewType}</span>
                </div>
                <p className="mt-1 text-[13px] leading-snug">{c.body}</p>
              </li>
            ))}
            <Link href={`/applications/${app.id}`} className="block text-xs font-medium text-primary hover:underline">
              Open reviews →
            </Link>
          </ul>
        )}
      </Block>
    </div>
  );
}
