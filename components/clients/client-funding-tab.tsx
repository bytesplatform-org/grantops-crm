"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TagList } from "@/components/shared/info-row";
import { updateFundingProfile } from "@/lib/data-service";
import type { Client, FundingProfile } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { splitList } from "@/components/leads/constants";

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-[13px] font-medium text-muted-foreground">{label}</h4>
      {children}
    </div>
  );
}

export function ClientFundingTab({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  const fp = client.fundingProfile;
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Funding profile</CardTitle>
            <CardDescription>Criteria used for opportunity matching and eligibility review.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil /> Edit Funding Profile
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-4">
            <div>
              <div className="text-[13px] text-muted-foreground">Target amount</div>
              <div className="mt-1 text-lg font-semibold tabular">{formatCurrency(fp.targetAmount)}</div>
            </div>
            <div>
              <div className="text-[13px] text-muted-foreground">Match capacity</div>
              <div className="mt-1 text-lg font-semibold tabular">Up to {fp.matchCapacityPct}%</div>
            </div>
            <div>
              <div className="text-[13px] text-muted-foreground">Past federal awards</div>
              <div className="mt-1 text-lg font-semibold tabular">{fp.pastAwards.length}</div>
            </div>
            <div>
              <div className="text-[13px] text-muted-foreground">Preferred agencies</div>
              <div className="mt-1 text-lg font-semibold tabular">{fp.preferredAgencies.length}</div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Block label="Funding objectives">
              <ul className="space-y-1.5 text-sm">
                {fp.objectives.map((o) => (
                  <li key={o} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" /> {o}
                  </li>
                ))}
              </ul>
            </Block>
            <Block label="Preferred agencies">
              <TagList items={fp.preferredAgencies} />
            </Block>
            <Block label="Eligible organization types">
              <TagList items={fp.eligibleOrgTypes} />
            </Block>
            <Block label="Geography">
              <TagList items={fp.geography} />
            </Block>
            <Block label="Industry keywords">
              <TagList items={fp.keywords} />
            </Block>
            <Block label="Relevant NAICS">
              <TagList items={client.naics} />
            </Block>
            <Block label="Certifications">
              <TagList items={client.certifications} />
            </Block>
            <Block label="Matching constraints">
              {fp.constraints.length ? (
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {fp.constraints.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" /> {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">None recorded</span>
              )}
            </Block>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Past award experience</CardTitle>
            <CardDescription>Federal and state awards relevant to past-performance scoring.</CardDescription>
          </div>
        </CardHeader>
        {fp.pastAwards.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Award</TableHead>
                <TableHead>Agency</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fp.pastAwards.map((a) => (
                <TableRow key={a.title + a.year}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell className="text-slate-600">{a.agency}</TableCell>
                  <TableCell className="tabular">{a.year}</TableCell>
                  <TableCell className="text-right tabular">{formatCurrency(a.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">No documented federal awards. Past performance will be a consideration in match scoring.</p>
          </CardContent>
        )}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">{open && <FundingForm client={client} onDone={() => setOpen(false)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function FundingForm({ client, onDone }: { client: Client; onDone: () => void }) {
  const fp = client.fundingProfile;
  const [f, setF] = useState({
    objectives: fp.objectives.join(", "),
    targetAmount: String(fp.targetAmount),
    preferredAgencies: fp.preferredAgencies.join(", "),
    eligibleOrgTypes: fp.eligibleOrgTypes.join(", "),
    geography: fp.geography.join(", "),
    keywords: fp.keywords.join(", "),
    constraints: fp.constraints.join("; "),
    matchCapacityPct: String(fp.matchCapacityPct),
  });
  const fields: [keyof typeof f, string][] = [
    ["objectives", "Funding objectives"],
    ["preferredAgencies", "Preferred agencies"],
    ["eligibleOrgTypes", "Eligible organization types"],
    ["geography", "Geography"],
    ["keywords", "Industry keywords"],
  ];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const patch: Partial<FundingProfile> = {
          objectives: splitList(f.objectives),
          targetAmount: Number(f.targetAmount) || 0,
          preferredAgencies: splitList(f.preferredAgencies),
          eligibleOrgTypes: splitList(f.eligibleOrgTypes),
          geography: splitList(f.geography),
          keywords: splitList(f.keywords),
          constraints: f.constraints.split(";").map((s) => s.trim()).filter(Boolean),
          matchCapacityPct: Math.max(0, Math.min(100, Number(f.matchCapacityPct) || 0)),
        };
        updateFundingProfile(client.id, patch);
        toast.success("Funding profile updated", { description: "Match scoring will use the new criteria." });
        onDone();
      }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle>Edit funding profile</DialogTitle>
        <DialogDescription>Separate values with commas. Constraints are separated with semicolons.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fp-target">Target amount ($)</Label>
          <Input id="fp-target" type="number" value={f.targetAmount} onChange={(e) => setF({ ...f, targetAmount: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fp-match">Match capacity (%)</Label>
          <Input id="fp-match" type="number" min={0} max={100} value={f.matchCapacityPct} onChange={(e) => setF({ ...f, matchCapacityPct: e.target.value })} />
        </div>
        {fields.map(([k, label]) => (
          <div key={k} className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`fp-${k}`}>{label}</Label>
            <Input id={`fp-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="fp-constraints">Matching constraints</Label>
          <Input id="fp-constraints" value={f.constraints} onChange={(e) => setF({ ...f, constraints: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save profile</Button>
      </DialogFooter>
    </form>
  );
}
