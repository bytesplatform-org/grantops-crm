"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Ban, Inbox as InboxIcon, Loader2, MailOpen, MailPlus, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { LeadStageBadge } from "@/components/shared/status-badge";
import { markThreadRead, sendLeadEmail, useAppData } from "@/lib/data-service";
import { cn, formatDateTime, initials, relativeTime } from "@/lib/utils";
import { buildThreads, snippet, splitFooter, type MailThread } from "./threads";

type Filter = "all" | "unread" | "awaiting";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "awaiting", label: "Awaiting reply" },
];

export function Inbox({
  threadId,
  onSelectThread,
  onOpenLead,
  onCompose,
}: {
  threadId?: string;
  onSelectThread: (id?: string) => void;
  onOpenLead: (leadId: string) => void;
  onCompose: () => void;
}) {
  const data = useAppData();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const threads = useMemo(() => buildThreads(data), [data]);
  const active = threads.find((t) => t.id === threadId);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "unread" && !t.unread) return false;
      if (filter === "awaiting" && !t.awaitingReply) return false;
      if (!term) return true;
      return [t.lead.contactName, t.lead.company, t.subject, ...t.messages.map((m) => m.body)].some((s) => s.toLowerCase().includes(term));
    });
  }, [threads, q, filter]);

  // Opening a conversation marks its replies as read.
  useEffect(() => {
    if (threadId) markThreadRead(threadId);
  }, [threadId, active?.messages.length]);

  return (
    <Card className="flex h-[calc(100vh-15.5rem)] min-h-[520px] overflow-hidden">
      <div className={cn("flex w-full flex-col border-r border-border md:w-[340px] md:shrink-0", active && "hidden md:flex")}>
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mail…" className="pl-8" aria-label="Search mail" />
            </div>
            <Button size="icon" onClick={onCompose} aria-label="New email" title="New email">
              <MailPlus />
            </Button>
          </div>
          <div role="group" aria-label="Filter conversations" className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-7 rounded-lg px-2.5 text-[12px] font-medium transition-colors",
                  filter === f.id ? "bg-dark text-white" : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                {f.label}
                {f.id === "unread" && threads.some((t) => t.unread) ? ` (${threads.filter((t) => t.unread).length})` : ""}
              </button>
            ))}
          </div>
        </div>
        <ul className="scrollbar-thin flex-1 overflow-y-auto">
          {visible.map((t) => (
            <li key={t.id}>
              <ThreadRow thread={t} active={t.id === threadId} onClick={() => onSelectThread(t.id)} />
            </li>
          ))}
          {!visible.length && <li className="px-4 py-10 text-center text-sm text-muted-foreground">{threads.length ? "No conversations match." : "No conversations yet."}</li>}
        </ul>
      </div>

      <div className={cn("min-w-0 flex-1 flex-col", active ? "flex" : "hidden md:flex")}>
        {active ? (
          <Conversation key={active.id} thread={active} onBack={() => onSelectThread(undefined)} onOpenLead={onOpenLead} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={InboxIcon}
              title="Select a conversation"
              description="Replies from leads arrive here. Start a new conversation from any lead or with New email."
              action={
                <Button variant="outline" onClick={onCompose}>
                  <MailPlus /> New email
                </Button>
              }
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function ThreadRow({ thread: t, active, onClick }: { thread: MailThread; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn("flex w-full gap-3 border-b border-zinc-100 px-4 py-3 text-left transition-colors", active ? "bg-zinc-100" : "hover:bg-zinc-50")}
    >
      <span className="relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-dark text-[11px] font-semibold text-white">
        {initials(t.lead.contactName)}
        {t.unread > 0 && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-2 ring-card" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-[13px]", t.unread ? "font-semibold" : "font-medium")}>{t.lead.contactName}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(t.last.sentAt)}</span>
        </span>
        <span className="block truncate text-[12px] text-muted-foreground">{t.lead.company}</span>
        <span className={cn("mt-1 block truncate text-[13px]", t.unread ? "font-medium text-foreground" : "text-zinc-600")}>{t.subject}</span>
        <span className="block truncate text-[12px] text-muted-foreground">
          {t.awaitingReply && <span className="text-zinc-500">You: </span>}
          {snippet(t.last.body)}
        </span>
      </span>
    </button>
  );
}

function Conversation({ thread: t, onBack, onOpenLead }: { thread: MailThread; onBack: () => void; onOpenLead: (leadId: string) => void }) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const blocked = t.lead.optedOut;

  // Open at the newest message, and follow new ones as they arrive.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [t.messages.length]);

  async function send() {
    if (!reply.trim() || sending || blocked) return;
    setSending(true);
    try {
      await sendLeadEmail({ leadId: t.lead.id, threadId: t.id, subject: t.subject.startsWith("Re:") ? t.subject : `Re: ${t.subject}`, body: reply });
      setReply("");
      toast.success(`Reply sent to ${t.lead.contactName}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <button type="button" onClick={onBack} className="-ml-1 mt-0.5 rounded-lg p-1 text-muted-foreground hover:bg-muted md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{t.subject}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <button type="button" onClick={() => onOpenLead(t.lead.id)} className="font-medium text-foreground hover:underline">
              {t.lead.contactName} · {t.lead.company}
            </button>
            <LeadStageBadge stage={t.lead.stage} />
            {blocked && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                <Ban className="size-3" /> Opted out
              </span>
            )}
          </div>
        </div>
        {t.messages.some((m) => m.direction === "inbound") && (
          <Button variant="ghost" size="sm" onClick={() => markThreadRead(t.id, false)} title="Mark as unread">
            <MailOpen /> Mark unread
          </Button>
        )}
      </div>

      <ol ref={listRef} className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-zinc-50/60 px-5 py-5">
        {t.messages.map((m) => {
          const [text, footer] = splitFooter(m.body);
          const out = m.direction === "outbound";
          return (
            <li key={m.id} className={cn("rounded-2xl border p-4", out ? "ml-6 border-zinc-200 bg-card" : "mr-6 border-lime-200 bg-lime-50/60")}>
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", out ? "bg-dark text-white" : "bg-brand text-zinc-900")}>
                  {initials(m.fromName)}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-medium">
                    {m.fromName} <span className="font-normal text-muted-foreground">&lt;{m.fromEmail}&gt;</span>
                  </div>
                  <div className="truncate text-[12px] text-muted-foreground">to {m.toName}</div>
                </div>
                <time dateTime={m.sentAt} title={new Date(m.sentAt).toLocaleString()} className="shrink-0 text-[12px] text-muted-foreground">
                  {formatDateTime(m.sentAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-zinc-800">{text}</p>
              {footer && <p className="mt-3 whitespace-pre-line border-t border-zinc-100 pt-2 text-[11px] leading-relaxed text-muted-foreground">{footer}</p>}
            </li>
          );
        })}
      </ol>

      <form
        className="border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {blocked ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
            <Ban className="size-4 shrink-0" /> {t.lead.company} asked not to be contacted, so replies are blocked.
          </div>
        ) : (
          <div className="rounded-xl border border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={3}
              placeholder={`Reply to ${t.lead.contactName}…`}
              aria-label="Reply"
              className="resize-none border-0 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
              <span className="text-[11px] text-muted-foreground">⌘/Ctrl + Enter to send · footer added automatically</span>
              <Button type="submit" size="sm" disabled={!reply.trim() || sending}>
                {sending ? <Loader2 className="animate-spin" /> : <Send />} Send
              </Button>
            </div>
          </div>
        )}
      </form>
    </>
  );
}
