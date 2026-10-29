"use client";
import { useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ScoreRing } from "@/components/shared/score-ring";
import { RecommendationBadge } from "@/components/shared/status-badge";
import { calculateMatch, useAppData } from "@/lib/data-service";
import type { GrantMatch } from "@/lib/types";
import { sleep } from "@/lib/utils";

export function CalculateMatchDialog({
  onCalculated,
  defaultClientId,
  defaultOpportunityId,
  trigger,
}: {
  onCalculated?: (m: GrantMatch) => void;
  defaultClientId?: string;
  defaultOpportunityId?: string;
  trigger?: React.ReactNode;
}) {
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [oppId, setOppId] = useState(defaultOpportunityId ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrantMatch | null>(null);
  const openOpps = data.opportunities.filter((o) => o.status !== "Closed" && o.status !== "Archived");

  const run = async () => {
    setLoading(true);
    await sleep(900);
    const m = calculateMatch(clientId, oppId);
    setLoading(false);
    if (!m) return;
    setResult(m);
    toast.success(`Potential match calculated: ${m.score}%`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Calculator /> Calculate Match
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calculate Match</DialogTitle>
          <DialogDescription>Score a client&apos;s funding profile against an opportunity&apos;s eligibility, priorities and timeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cm-client">Client</Label>
            <Select id="cm-client" value={clientId} onChange={(e) => { setClientId(e.target.value); setResult(null); }}>
              <option value="">Select a client…</option>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cm-opp">Opportunity</Label>
            <Select id="cm-opp" value={oppId} onChange={(e) => { setOppId(e.target.value); setResult(null); }}>
              <option value="">Select an opportunity…</option>
              {openOpps.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.agencyCode} — {o.title}
                </option>
              ))}
            </Select>
          </div>
          {result && (
            <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/40 p-4">
              <ScoreRing score={result.score} size={64} />
              <div className="min-w-0 flex-1">
                <RecommendationBadge value={result.recommendation} />
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {result.reasons.slice(0, 2).map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                  {result.risks.slice(0, 1).map((r) => (
                    <li key={r} className="text-amber-700">• {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {result ? (
            <Button
              onClick={() => {
                onCalculated?.(result);
                setOpen(false);
                setResult(null);
              }}
            >
              View match analysis
            </Button>
          ) : (
            <Button onClick={run} disabled={!clientId || !oppId || loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Calculator />}
              {loading ? "Scoring…" : "Calculate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
