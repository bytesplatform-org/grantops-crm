"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Info, Mail, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDocumentRequest, primaryContact, sendDocumentRequest, useAppData } from "@/lib/data-service";
import { isActive } from "@/lib/selectors";
import type { DocumentCategory } from "@/lib/types";
import { cn, formatDate, isoFromNow } from "@/lib/utils";

interface Item {
  name: string;
  category: DocumentCategory;
}

const COMMON: Item[] = [
  { name: "2025 operating budget", category: "Budget" },
  { name: "Executive Director resume", category: "Resume" },
  { name: "Current organization chart", category: "Organization Chart" },
  { name: "Two letters of support", category: "Letter of Support" },
  { name: "Most recent audited financial statement", category: "Financial Statement" },
];

function categoryFor(req: string): DocumentCategory {
  if (/letter/i.test(req)) return "Letter of Support";
  if (/resume|personnel/i.test(req)) return "Resume";
  if (/financ|audit/i.test(req)) return "Financial Statement";
  if (/budget|cost|quote/i.test(req)) return "Budget";
  if (/chart/i.test(req)) return "Organization Chart";
  if (/SF-/i.test(req)) return "Federal Form";
  return "Other";
}

export function RequestDocumentsDialog({ applicationId, trigger }: { applicationId?: string; trigger?: React.ReactNode }) {
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [appId, setAppId] = useState(applicationId ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<Item[]>([]);
  const [customName, setCustomName] = useState("");
  const [due, setDue] = useState(isoFromNow(7).slice(0, 10));
  const [message, setMessage] = useState("");

  const apps = data.applications.filter(isActive);
  const app = data.applications.find((a) => a.id === appId);
  const client = data.clients.find((c) => c.id === app?.clientId);
  const contact = app ? primaryContact(data, app.clientId) : undefined;
  const opp = data.opportunities.find((o) => o.id === app?.opportunityId);

  const suggestions = useMemo<Item[]>(() => {
    if (!app) return [];
    const fromCompliance = app.compliance
      .filter((c) => (c.status === "Missing" || c.status === "In Progress") && (c.assignedSection === "Documents" || c.assignedSection === "Budget"))
      .map((c) => ({ name: c.requirement, category: categoryFor(c.requirement) }));
    const all = [...fromCompliance, ...COMMON, ...custom];
    return all.filter((x, i) => all.findIndex((y) => y.name.toLowerCase() === x.name.toLowerCase()) === i);
  }, [app, custom]);

  const chosen = suggestions.filter((s) => selected.has(s.name));

  const reset = () => {
    setStep(1);
    setAppId(applicationId ?? "");
    setSelected(new Set());
    setCustom([]);
    setCustomName("");
    setDue(isoFromNow(7).slice(0, 10));
  };

  const pickApp = (id: string) => {
    setAppId(id);
    const a = data.applications.find((x) => x.id === id);
    const pre = a?.compliance.filter((c) => c.status === "Missing" && (c.assignedSection === "Documents" || c.assignedSection === "Budget")).map((c) => c.requirement) ?? [];
    setSelected(new Set(pre));
  };

  const goPreview = () => {
    const first = contact?.name.split(" ")[0] ?? "there";
    setMessage(
      `Hi ${first},\n\nTo keep the ${opp?.title ?? "application"} on schedule, please provide the following by ${formatDate(due + "T12:00:00")}:\n\nPlease provide:\n${chosen.map((c) => `• ${c.name}`).join("\n")}\n\nYou can upload files to your shared client folder or reply to this message with attachments.\n\nThank you,\n${data.team.find((t) => t.id === data.settings.currentUserId)?.name ?? "GrantOS team"}`,
    );
    setStep(3);
  };

  const submit = (send: boolean) => {
    if (!app) return;
    const id = createDocumentRequest({
      applicationId: app.id,
      clientId: app.clientId,
      contactId: contact?.id,
      message,
      dueDate: new Date(due + "T17:00:00").toISOString(),
      items: chosen,
    });
    if (send) {
      sendDocumentRequest(id);
      toast.success(`Request sent to ${contact?.name ?? client?.name}`, { description: `${chosen.length} item${chosen.length === 1 ? "" : "s"} requested · demo send, no email delivered` });
    } else toast.success("Draft request saved");
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && applicationId) pickApp(applicationId); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Mail /> Request Documents
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request documents from client</DialogTitle>
          <DialogDescription>Step {step} of 3 · {step === 1 ? "Select application" : step === 2 ? "Choose documents" : "Review request"}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <span key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-primary" : "bg-slate-200")} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Application</Label>
              <Select value={appId} onChange={(e) => pickApp(e.target.value)}>
                <option value="">Select an application…</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {data.opportunities.find((o) => o.id === a.opportunityId)?.title} — {data.clients.find((c) => c.id === a.clientId)?.name}
                  </option>
                ))}
              </Select>
            </div>
            {app && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div className="font-medium">{client?.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Recipient: {contact ? `${contact.name} · ${contact.email}` : "No contact on file"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {app.compliance.filter((c) => c.status === "Missing").length} missing requirements · deadline {formatDate(app.deadline)}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border scrollbar-thin">
              {suggestions.map((s) => {
                const checked = selected.has(s.name);
                return (
                  <li key={s.name}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() =>
                          setSelected((prev) => {
                            const n = new Set(prev);
                            if (n.has(s.name)) n.delete(s.name);
                            else n.add(s.name);
                            return n;
                          })
                        }
                      />
                      <span className="flex-1 text-sm">{s.name}</span>
                      <span className="text-[11px] text-muted-foreground">{s.category}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-2">
              <Input placeholder="Add a custom item…" value={customName} onChange={(e) => setCustomName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && customName.trim()) { e.preventDefault(); addCustom(); } }} />
              <Button variant="outline" onClick={addCustom} disabled={!customName.trim()}>
                <Plus /> Add
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Recipient</Label>
                <Input value={contact ? `${contact.name} (${contact.title})` : "—"} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="req-due">Due date</Label>
                <Input id="req-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              To: <span className="font-medium text-foreground">{contact?.name}</span> &lt;{contact?.email}&gt;
            </div>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-64 font-mono text-[13px] leading-relaxed" />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" /> Demo workspace: sending records the request and activity — no email is delivered.
            </p>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="ghost" className="sm:mr-auto" onClick={() => setStep(step - 1)}>
              <ArrowLeft /> Back
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!app}>
              Continue <ArrowRight />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={goPreview} disabled={!chosen.length}>
              Generate request ({chosen.length}) <ArrowRight />
            </Button>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => submit(false)}>Save Draft</Button>
              <Button onClick={() => submit(true)}>
                <Send /> Send Request
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  function addCustom() {
    const name = customName.trim();
    if (!name) return;
    setCustom((c) => [...c, { name, category: categoryFor(name) }]);
    setSelected((s) => new Set(s).add(name));
    setCustomName("");
  }
}
