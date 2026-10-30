"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { aiService, type RequirementCheck } from "@/lib/ai-service";
import { updateSection, useAppData } from "@/lib/data-service";
import type { Application, ApplicationSection, SectionStatus } from "@/lib/types";
import { cn, wordCount } from "@/lib/utils";
import { AiToolbar, type AiAction } from "./ai-toolbar";
import { RequirementResult } from "./requirement-result";

const STATUSES: SectionStatus[] = ["Not Started", "Drafting", "In Review", "Complete"];

export function SectionEditor({ app, section, onTextChange }: { app: Application; section: ApplicationSection; onTextChange: (t: string) => void }) {
  const data = useAppData();
  const [text, setText] = useState(section.content);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("saved");
  const [busy, setBusy] = useState<AiAction | null>(null);
  const [undo, setUndo] = useState<string | null>(null);
  const [check, setCheck] = useState<RequirementCheck | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const textRef = useRef(text);
  const dirty = useRef(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const client = data.clients.find((c) => c.id === app.clientId);
  const opportunity = data.opportunities.find((o) => o.id === app.opportunityId);

  // Debounced autosave.
  useEffect(() => {
    if (!dirty.current) return;
    setSaving("saving");
    const t = setTimeout(() => {
      updateSection(app.id, section.id, { content: textRef.current, status: section.status === "Not Started" && textRef.current.trim() ? "Drafting" : section.status });
      dirty.current = false;
      setSaving("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [text, app.id, section.id, section.status]);

  // Flush unsaved text when switching sections / leaving.
  useEffect(
    () => () => {
      if (dirty.current) updateSection(app.id, section.id, { content: textRef.current });
    },
    [app.id, section.id],
  );

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(420, el.scrollHeight)}px`;
  }, [text]);

  const change = (t: string) => {
    textRef.current = t;
    dirty.current = true;
    setText(t);
    onTextChange(t);
  };

  const applyAi = (next: string, message: string) => {
    setUndo(textRef.current);
    textRef.current = next;
    dirty.current = false;
    setText(next);
    onTextChange(next);
    updateSection(app.id, section.id, { content: next, status: section.status === "Not Started" ? "Drafting" : section.status }, { log: message });
    setSaving("saved");
  };

  const run = async (a: AiAction, force = false) => {
    if (!client || !opportunity) return;
    if (a === "draft" && textRef.current.trim() && !force) {
      setConfirmReplace(true);
      return;
    }
    setBusy(a);
    try {
      if (a === "draft") {
        const draft = await aiService.generateDraft(section.key, { client, opportunity, amount: app.fundingRequested });
        applyAi(draft, `Draft generated for ${section.title}.`);
        toast.success("Draft generated", { description: "Review and tailor before submission." });
      } else {
        setCheck(await aiService.checkRequirement({ title: section.title, content: textRef.current, wordLimit: section.wordLimit }));
      }
    } finally {
      setBusy(null);
    }
  };

  const words = wordCount(text);
  const over = words > section.wordLimit;

  return (
    <Card className="flex min-h-full flex-col">
      <div className="space-y-3 border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Section status"
              value={section.status}
              onValueChange={(v) => {
                updateSection(app.id, section.id, { status: v as SectionStatus }, { log: `${section.title} marked ${v}.` });
                toast.success(`Status set to ${v}`);
              }}
              className="w-36"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Select aria-label="Assignee" value={section.assigneeId} onValueChange={(v) => updateSection(app.id, section.id, { assigneeId: v })} className="w-44">
              {data.team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
        </div>
        <AiToolbar busy={busy} hasText={!!text.trim()} canUndo={undo !== null} onAction={(a) => run(a)} onUndo={() => { if (undo !== null) { applyAi(undo, `${section.title}: AI change reverted.`); setUndo(null); } }} />
        {check && <RequirementResult result={check} onClose={() => setCheck(null)} />}
      </div>
      <div className="relative flex-1 px-6 py-6">
        {busy && busy !== "check" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm shadow-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              Drafting from client profile, NOFO and evidence…
            </div>
          </div>
        )}
        <textarea
          ref={areaRef}
          value={text}
          onChange={(e) => change(e.target.value)}
          placeholder={`Start writing the ${section.title.toLowerCase()}, or use Generate Draft to create a first draft from the client profile and NOFO requirements.`}
          className="mx-auto block w-full max-w-[760px] resize-none bg-transparent text-[15px] leading-[1.7] text-slate-800 outline-none placeholder:text-slate-400"
          aria-label={`${section.title} content`}
        />
      </div>
      <div className="flex items-center justify-between border-t border-border px-6 py-2.5 text-xs text-muted-foreground">
        <span className={cn("tabular", over && "font-medium text-red-600")}>
          {words.toLocaleString()} / {section.wordLimit.toLocaleString()} words{over && " · over limit"}
        </span>
        <span className="flex items-center gap-1">
          {saving === "saving" ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3 text-emerald-600" />}
          {saving === "saving" ? "Saving…" : "Saved"}
        </span>
      </div>
      <Dialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Replace existing content?</DialogTitle>
            <DialogDescription>Generate Draft will replace the current {section.title} text. You can undo the change afterwards.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReplace(false)}>Cancel</Button>
            <Button onClick={() => { setConfirmReplace(false); run("draft", true); }}>Replace with draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
