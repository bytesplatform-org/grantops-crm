"use client";
import { useState } from "react";
import { Ban, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sendLeadEmail, useAppData } from "@/lib/data-service";
import { EMAIL_TEMPLATES, emailFooter, fillTemplate } from "@/lib/mock/lead-outreach";

/**
 * New email to a lead. Pass `leadId` to preset the recipient (from a lead row or
 * drawer); without it the user picks any lead who hasn't opted out.
 */
export function ComposeDialog({
  open,
  onOpenChange,
  leadId,
  onSent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId?: string;
  onSent?: (threadId: string) => void;
}) {
  const data = useAppData();
  const sender = data.team.find((t) => t.id === data.settings.currentUserId) ?? data.team[0];
  const [to, setTo] = useState(leadId ?? "");
  const [template, setTemplate] = useState("intro");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [lastKey, setLastKey] = useState("");

  const applyTemplate = (tplId: string, recipientId: string) => {
    const lead = data.leads.find((l) => l.id === recipientId);
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === tplId);
    if (!lead || !tpl) {
      setSubject("");
      setBody("");
      return;
    }
    setSubject(fillTemplate(tpl.subject, lead, sender.name));
    setBody(fillTemplate(tpl.body, lead, sender.name));
  };

  // Reset whenever the dialog opens (or opens for a different lead).
  const key = `${open}-${leadId ?? ""}`;
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setTo(leadId ?? "");
      setTemplate("intro");
      applyTemplate("intro", leadId ?? "");
      setSending(false);
    }
  }

  const lead = data.leads.find((l) => l.id === to);
  const canSend = !!lead && !lead.optedOut && subject.trim() && body.trim() && !sending;

  async function send() {
    if (!lead || !canSend) return;
    setSending(true);
    try {
      const { threadId } = await sendLeadEmail({ leadId: lead.id, subject, body });
      toast.success(`Email sent to ${lead.contactName}`, { description: subject });
      onOpenChange(false);
      onSent?.(threadId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send email");
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !sending && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New email</DialogTitle>
          <DialogDescription>Sent from {sender.email}. Replies land in the Leads inbox.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <div className="space-y-1.5">
              <Label htmlFor="compose-to">To</Label>
              {leadId && lead ? (
                <div id="compose-to" className="flex h-9 items-center gap-2 rounded-md border border-input bg-zinc-50 px-3 text-sm">
                  <span className="truncate font-medium">{lead.contactName}</span>
                  <span className="truncate text-muted-foreground">&lt;{lead.email}&gt;</span>
                </div>
              ) : (
                <Select
                  id="compose-to"
                  aria-label="Recipient"
                  placeholder="Choose a lead…"
                  searchable
                  value={to}
                  onValueChange={(v) => {
                    setTo(v);
                    applyTemplate(template, v);
                  }}
                >
                  {data.leads.map((l) => (
                    <option key={l.id} value={l.id} disabled={l.optedOut}>
                      {`${l.contactName} — ${l.company}${l.optedOut ? " (opted out)" : ""}`}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compose-template">Template</Label>
              <Select
                id="compose-template"
                aria-label="Template"
                value={template}
                onValueChange={(v) => {
                  setTemplate(v);
                  applyTemplate(v, to);
                }}
              >
                {EMAIL_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
                <option value="blank">Blank</option>
              </Select>
            </div>
          </div>

          {lead?.optedOut && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
              <Ban className="size-4 shrink-0" /> {lead.company} asked not to be contacted. Sending is blocked.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input id="compose-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <p className="whitespace-pre-line rounded-lg bg-zinc-50 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
              {emailFooter(data.settings.firmName)}
            </p>
            <p className="text-[12px] text-muted-foreground">This footer is added to every email. Sending is simulated in this demo.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={sending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSend}>
              {sending ? <Loader2 className="animate-spin" /> : <Send />} {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
