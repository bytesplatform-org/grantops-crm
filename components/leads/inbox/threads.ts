import type { AppData, EmailMessage, Lead } from "@/lib/types";

export interface MailThread {
  id: string;
  lead: Lead;
  subject: string;
  messages: EmailMessage[];
  last: EmailMessage;
  unread: number;
  /** The last message is ours, so we're waiting on the lead. */
  awaitingReply: boolean;
}

/** Groups the flat email list into conversations, newest activity first. */
export function buildThreads(data: Pick<AppData, "emails" | "leads">): MailThread[] {
  const byThread = new Map<string, EmailMessage[]>();
  for (const e of data.emails) {
    const list = byThread.get(e.threadId);
    if (list) list.push(e);
    else byThread.set(e.threadId, [e]);
  }
  const threads: MailThread[] = [];
  for (const [id, msgs] of byThread) {
    const lead = data.leads.find((l) => l.id === msgs[0].leadId);
    if (!lead) continue;
    const messages = [...msgs].sort((a, b) => +new Date(a.sentAt) - +new Date(b.sentAt));
    const last = messages[messages.length - 1];
    threads.push({
      id,
      lead,
      subject: messages[0].subject,
      messages,
      last,
      unread: messages.filter((m) => m.direction === "inbound" && !m.read).length,
      awaitingReply: last.direction === "outbound",
    });
  }
  return threads.sort((a, b) => +new Date(b.last.sentAt) - +new Date(a.last.sentAt));
}

export const unreadCount = (data: Pick<AppData, "emails">) => data.emails.filter((e) => e.direction === "inbound" && !e.read).length;

/** First meaningful line of a message, skipping our footer and a bare "Hi Name," greeting. */
export function snippet(body: string) {
  const lines = splitFooter(body)[0]
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const isGreeting = (l: string) => /^(hi|hello|dear)\b/i.test(l) && l.length <= 30 && /[,!]$/.test(l);
  return (lines.find((l) => !isGreeting(l)) ?? lines[0] ?? "").slice(0, 140);
}

/** Splits our auto-appended footer from the message so it can be shown muted. */
export function splitFooter(body: string): [string, string | null] {
  const i = body.lastIndexOf("\n—\n");
  return i === -1 ? [body, null] : [body.slice(0, i).trimEnd(), body.slice(i + 1)];
}
