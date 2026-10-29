"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { markSubmitted, recordOutcome } from "@/lib/data-service";
import { cn } from "@/lib/utils";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function demoTrackingNumber() {
  return `GRANT-DEMO-${String(Math.floor(10_000_000 + Math.random() * 89_999_999))}`;
}

export function MarkSubmittedDialog({ appId, open, onOpenChange, initialTracking }: { appId: string; open: boolean; onOpenChange: (o: boolean) => void; initialTracking: string }) {
  const [date, setDate] = useState(today());
  const [tracking, setTracking] = useState(initialTracking);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record submission</DialogTitle>
          <DialogDescription>Confirm the application was submitted by the Authorized Organization Representative in Grants.gov Workspace.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!tracking.trim()) return;
            const iso = new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString();
            markSubmitted(appId, iso, tracking.trim());
            toast.success("Application marked Submitted", { description: `Tracking reference ${tracking.trim()}` });
            onOpenChange(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="sub-date">Submission date</Label>
            <Input id="sub-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-track">Grants.gov tracking / reference number</Label>
            <Input id="sub-track" value={tracking} onChange={(e) => setTracking(e.target.value)} className="font-mono" required />
            <p className="text-[11px] text-muted-foreground">Demo workspace — a fictional reference is prefilled.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Mark Submitted</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecordOutcomeDialog({ appId, requested, open, onOpenChange }: { appId: string; requested: number; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [decision, setDecision] = useState<"Awarded" | "Not Awarded">("Awarded");
  const [amount, setAmount] = useState(String(requested));
  const [notes, setNotes] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record outcome</DialogTitle>
          <DialogDescription>Log the agency decision once the award notice or decline letter is received.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            recordOutcome(appId, { decision, amountAwarded: decision === "Awarded" ? Number(amount) || 0 : 0, notes });
            toast.success(decision === "Awarded" ? "Award recorded" : "Outcome recorded");
            onOpenChange(false);
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["Awarded", "Not Awarded"] as const).map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDecision(d)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                  decision === d ? (d === "Awarded" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-red-400 bg-red-50 text-red-800") : "border-border hover:bg-muted",
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {decision === "Awarded" && (
            <div className="space-y-1.5">
              <Label htmlFor="amt">Amount awarded</Label>
              <Input id="amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={decision === "Awarded" ? "Award terms, period of performance start…" : "Reviewer feedback, debrief request…"} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant={decision === "Awarded" ? "success" : "default"}>Save outcome</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
