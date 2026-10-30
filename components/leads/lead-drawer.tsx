"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Ban, BadgeCheck, Building2, ChevronRight, Globe, Mail, MapPin, Pencil, Phone, Plus, Radar, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LeadStageBadge } from "@/components/shared/status-badge";
import { TagList } from "@/components/shared/info-row";
import { MemberAvatar } from "@/components/shared/avatar";
import { addLeadNote, addLeadTask, convertLeadToClient, moveLeadStage, toggleLeadTask, useAppData } from "@/lib/data-service";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/types";
import { cn, formatCurrency, formatDate, formatShortDate, isoFromNow, relativeTime } from "@/lib/utils";
import { memberName } from "@/lib/selectors";
import { fromDateInput, toDateInput } from "./constants";
import { buildThreads, snippet } from "./inbox/threads";

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="border-b border-border px-6 py-5 last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LeadDrawer({
  lead,
  onClose,
  onEdit,
  onEmail,
  onOpenThread,
}: {
  lead?: Lead;
  onClose: () => void;
  onEdit: (l: Lead) => void;
  onEmail: (leadId: string) => void;
  onOpenThread: (threadId: string) => void;
}) {
  // Keep showing the last lead while the panel slides out after closing.
  const [shown, setShown] = useState(lead);
  if (lead && lead !== shown) setShown(lead);
  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="max-w-[560px]">{shown && <LeadDetail key={shown.id} lead={shown} onEdit={onEdit} onEmail={onEmail} onOpenThread={onOpenThread} />}</SheetContent>
    </Sheet>
  );
}

function LeadDetail({
  lead,
  onEdit,
  onEmail,
  onOpenThread,
}: {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onEmail: (leadId: string) => void;
  onOpenThread: (threadId: string) => void;
}) {
  const data = useAppData();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(toDateInput(isoFromNow(3)));

  const timeline = useMemo(() => {
    const acts = data.activities.filter((a) => a.leadId === lead.id).map((a) => ({ id: a.id, kind: "activity" as const, body: a.message, actorId: a.actorId as string, at: a.createdAt }));
    const notes = lead.notes.map((n) => ({ id: n.id, kind: "note" as const, body: n.body, actorId: n.authorId, at: n.createdAt }));
    const created = { id: "created", kind: "activity" as const, body: `Discovered via ${lead.source}.`, actorId: "system", at: lead.discoveredAt };
    return [...acts, ...notes, created].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [data.activities, lead]);

  const canConvert = lead.stage === "Won" || lead.stage === "Negotiation";
  const threads = useMemo(() => buildThreads({ emails: data.emails.filter((e) => e.leadId === lead.id), leads: [lead] }), [data.emails, lead]);

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2">
          <LeadStageBadge stage={lead.stage} />
          <Badge variant="outline">{lead.organizationType}</Badge>
        </div>
        <SheetTitle className="mt-2 text-lg">{lead.company}</SheetTitle>
        <SheetDescription>{lead.fundingNeed}</SheetDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {lead.optedOut ? (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-red-50 px-2.5 text-[13px] font-medium text-red-700" title="This lead asked not to be contacted">
              <Ban className="size-3.5" /> Opted out
            </span>
          ) : (
            <Button size="sm" onClick={() => onEmail(lead.id)}>
              <Mail /> Email
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(lead)}>
            <Pencil /> Edit
          </Button>
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="size-3.5 text-muted-foreground" />
            <Select
              aria-label="Move stage"
              className="w-44"
              value={lead.stage}
              onValueChange={(v) => {
                moveLeadStage(lead.id, v as LeadStage);
                toast.success(`Moved to ${v}`);
              }}
            >
              {LEAD_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          {canConvert && (
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                const id = convertLeadToClient(lead.id);
                if (id) {
                  toast.success("Converted to client", { description: `${lead.company} is now onboarding.` });
                  router.push(`/clients/${id}`);
                }
              }}
            >
              <UserCheck /> Convert to Client
            </Button>
          )}
        </div>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Section title="Contact information">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <span className="font-medium">{lead.contactName}</span>
              <span className="text-muted-foreground">· {lead.contactTitle}</span>
            </div>
            <button
              type="button"
              disabled={lead.optedOut}
              onClick={() => onEmail(lead.id)}
              className="flex items-center gap-2 text-left hover:underline disabled:cursor-not-allowed disabled:no-underline"
              title={lead.optedOut ? "Opted out — outreach blocked" : "Compose an email"}
            >
              <Mail className="size-4 text-muted-foreground" />
              <span className={cn(lead.optedOut && "text-muted-foreground line-through")}>{lead.email}</span>
              {lead.emailConfidence === "Verified" ? (
                <span className="inline-flex items-center gap-0.5 text-[12px] text-emerald-700">
                  <BadgeCheck className="size-3.5" /> Verified
                </span>
              ) : (
                <span className="text-[12px] text-amber-700">Likely</span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" /> <span className="tabular">{lead.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" /> {lead.location}
            </div>
          </div>
        </Section>
        <Section title="How we found them">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Radar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                {lead.source} <span className="text-muted-foreground">· {relativeTime(lead.discoveredAt)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">Contact found on {lead.foundOn}</span>
            </div>
          </div>
          {lead.signals.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {lead.signals.map((sig) => (
                <li key={sig} className="flex items-start gap-2 text-[13px]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lime-500" />
                  {sig}
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section
          title={`Email${threads.length ? ` (${threads.length})` : ""}`}
          action={
            !lead.optedOut && (
              <Button size="xs" variant="outline" onClick={() => onEmail(lead.id)}>
                <Plus /> New email
              </Button>
            )
          }
        >
          {threads.length ? (
            <ul className="-mx-2 space-y-1">
              {threads.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => onOpenThread(t.id)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-zinc-50">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn("truncate text-[13px]", t.unread ? "font-semibold" : "font-medium")}>{t.subject}</span>
                        {t.unread > 0 && <span className="shrink-0 rounded-full bg-brand px-1.5 text-[11px] font-semibold text-zinc-900">{t.unread} new</span>}
                      </span>
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {t.awaitingReply ? "You: " : `${t.lead.contactName}: `}
                        {snippet(t.last.body)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(t.last.sentAt)}</span>
                    <ChevronRight className="size-4 shrink-0 text-zinc-300 group-hover:text-zinc-500" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{lead.optedOut ? "This lead opted out of email." : "No emails yet."}</p>
          )}
        </Section>
        <Section title="Opportunity">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Est. project value</dt>
              <dd className="mt-0.5 font-semibold tabular">{formatCurrency(lead.estimatedValue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Owner</dt>
              <dd className="mt-0.5">
                <MemberAvatar id={lead.ownerId} showName />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Proposal status</dt>
              <dd className="mt-0.5 font-medium">{lead.proposalStatus}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Engagement value</dt>
              <dd className="mt-0.5 font-medium tabular">{lead.proposalValue ? formatCurrency(lead.proposalValue) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Next action</dt>
              <dd className="mt-0.5">
                {lead.nextAction} <span className="text-muted-foreground">· {formatShortDate(lead.nextActionDate)}</span>
              </dd>
            </div>
          </dl>
        </Section>
        <Section title="Funding goals">
          <TagList items={lead.fundingGoals} />
          <h4 className="mb-2 mt-4 text-xs text-muted-foreground">Possible grant categories</h4>
          <TagList items={lead.grantCategories} />
        </Section>
        <Section title={`Tasks (${lead.tasks.filter((t) => !t.done).length} open)`}>
          <ul className="space-y-2">
            {lead.tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2.5 text-sm">
                <Checkbox id={t.id} checked={t.done} onCheckedChange={() => toggleLeadTask(lead.id, t.id)} />
                <label htmlFor={t.id} className={cn("flex-1", t.done && "text-muted-foreground line-through")}>
                  {t.title}
                </label>
                <span className="text-xs text-muted-foreground">{formatShortDate(t.dueDate)}</span>
              </li>
            ))}
            {!lead.tasks.length && <li className="text-sm text-muted-foreground">No tasks yet.</li>}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!taskTitle.trim()) return;
              addLeadTask(lead.id, taskTitle.trim(), fromDateInput(taskDue));
              setTaskTitle("");
              toast.success("Task added");
            }}
          >
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a task…" className="h-8" />
            <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="h-8 w-36" aria-label="Due date" />
            <Button type="submit" size="sm" variant="outline">
              <Plus /> Add
            </Button>
          </form>
        </Section>
        <Section title="Notes & activity">
          <form
            className="mb-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) return;
              addLeadNote(lead.id, note.trim());
              setNote("");
              toast.success("Note added");
            }}
          >
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Log a call, meeting, or note…" rows={2} />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!note.trim()}>
                Add note
              </Button>
            </div>
          </form>
          <ol className="space-y-3">
            {timeline.map((t) => (
              <li key={t.id} className="flex gap-3">
                <MemberAvatar id={t.actorId} size="sm" />
                <div className={cn("min-w-0 flex-1", t.kind === "note" && "rounded-md border border-border bg-muted/40 px-3 py-2")}>
                  <p className="text-[13px] leading-snug">{t.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {memberName(data, t.actorId)} · {t.kind === "note" ? "Note" : "Activity"} · {relativeTime(t.at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[11px] text-muted-foreground">Lead created {formatDate(lead.createdAt)}</p>
        </Section>
      </div>
    </>
  );
}
