"use client";
import { AlertTriangle, CheckCircle2, ExternalLink, FileSpreadsheet, FileText, ScanText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { InfoGrid, TagList } from "@/components/shared/info-row";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/lib/data-service";
import { eligibilityLabel } from "@/lib/selectors";
import type { Opportunity } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";

const GRANTS_GOV = "https://www.grants.gov/";

export function OverviewTab({ opp }: { opp: Opportunity }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Program Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-700">{opp.summary}</p>
            <div className="mt-4">
              <div className="mb-1.5 text-[13px] text-muted-foreground">Keywords</div>
              <TagList items={opp.keywords} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Key Facts</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoGrid
              items={[
                { label: "Agency", value: opp.agency },
                { label: "Sub-agency", value: opp.subAgency },
                { label: "Opportunity Number", value: <span className="font-mono text-[13px]">{opp.opportunityNumber}</span> },
                { label: "Assistance Listing", value: opp.assistanceListing },
                { label: "Funding Instrument", value: opp.instrument },
                { label: "Category", value: opp.category },
                { label: "Estimated Program Funding", value: formatCurrency(opp.estimatedFunding) },
                { label: "Award Ceiling", value: formatCurrency(opp.awardCeiling) },
                { label: "Award Floor", value: formatCurrency(opp.awardFloor) },
                { label: "Expected Awards", value: `~${opp.expectedAwards}` },
                { label: "Posted", value: formatDate(opp.postedDate) },
                { label: "Closing Date", value: formatDate(opp.deadline) },
              ]}
            />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Eligible Applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {opp.eligibility.map((e) => (
                <li key={e} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-600" /> {e}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Geography: {opp.eligibleStates?.join(", ") ?? "Nationwide"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost share / match</span>
              <span className="font-medium">{opp.costSharePct ? `${opp.costSharePct}% required` : "Not required"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period of performance</span>
              <span className="font-medium">{opp.periodOfPerformance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission</span>
              <span className="font-medium">Grants.gov Workspace</span>
            </div>
          </CardContent>
        </Card>
        <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">
          Demo Opportunity — sample data for demonstration. Always confirm details against the official announcement on Grants.gov.
        </p>
      </div>
    </div>
  );
}

function Mark({ ok, warn }: { ok: boolean; warn?: boolean }) {
  return ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : warn ? <AlertTriangle className="size-4 text-amber-500" /> : <XCircle className="size-4 text-red-500" />;
}

export function EligibilityTab({ opp }: { opp: Opportunity }) {
  const data = useAppData();
  const matches = data.matches.filter((m) => m.opportunityId === opp.id && m.status !== "Dismissed").sort((a, b) => b.score - a.score);
  if (!matches.length) return <EmptyState icon={CheckCircle2} title="No clients to review" description="Match clients to this opportunity to run an eligibility review." />;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eligibility Review by Client</CardTitle>
        <span className="text-xs text-muted-foreground">Preliminary review — final eligibility is determined by the awarding agency</span>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Applicant type</TableHead>
            <TableHead>Geography</TableHead>
            <TableHead>Cost share capacity</TableHead>
            <TableHead>SAM.gov</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((m) => {
            const c = data.clients.find((x) => x.id === m.clientId);
            if (!c) return null;
            const typeOk = opp.eligibility.includes(c.organizationType);
            const geoOk = m.breakdown.geographicFit >= 60;
            const csOk = opp.costSharePct <= c.fundingProfile.matchCapacityPct;
            const label = eligibilityLabel(m);
            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5"><Mark ok={typeOk} /> {c.organizationType}</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5"><Mark ok={geoOk} warn /> {c.state}</span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <Mark ok={csOk} warn /> {c.fundingProfile.matchCapacityPct}% vs {opp.costSharePct}% required
                  </span>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5"><Mark ok={c.samRegistration === "Active"} warn /> {c.samRegistration}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={label === "Eligible" ? "success" : label === "Not Eligible" ? "danger" : "warning"}>{label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function ChecklistSection({ title, items, checked, onToggle }: { title: string; items: string[]; checked: Record<string, boolean>; onToggle: (item: string, v: boolean) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <span className="text-xs text-muted-foreground tabular">
          {items.filter((i) => checked[i]).length}/{items.length} reviewed
        </span>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <Checkbox id={`req-${title}-${i}`} checked={!!checked[i]} onCheckedChange={(v) => onToggle(i, v === true)} />
              <label htmlFor={`req-${title}-${i}`} className={cn("text-sm", checked[i] && "text-muted-foreground line-through")}>{i}</label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function RequirementsTab({ opp, onAnalyze }: { opp: Opportunity; onAnalyze: () => void }) {
  const data = useAppData();
  const analysis = data.nofoAnalyses[opp.id];
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (item: string, v: boolean) => setChecked((s) => ({ ...s, [item]: v }));
  if (!analysis)
    return (
      <EmptyState
        icon={ScanText}
        title="Requirements not yet extracted"
        description="Run the NOFO analysis to build the requirements checklist."
        action={<Button onClick={onAnalyze}><ScanText /> Go to NOFO Analysis</Button>}
      />
    );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChecklistSection checked={checked} onToggle={toggle} title="Required Attachments" items={analysis.requiredAttachments} />
      <div className="space-y-4">
        <ChecklistSection checked={checked} onToggle={toggle} title="Submission Requirements" items={analysis.submissionRequirements} />
        <ChecklistSection checked={checked} onToggle={toggle} title="Key Requirements" items={analysis.keyRequirements} />
      </div>
    </div>
  );
}

const PACKAGE = [
  { name: "NOFO_Full_Announcement.pdf", desc: "Full notice of funding opportunity", size: "1.8 MB", icon: FileText },
  { name: "Application_Instructions.pdf", desc: "Grants.gov application package instructions", size: "640 KB", icon: FileText },
  { name: "Budget_Template.xlsx", desc: "SF-424A aligned budget workbook", size: "92 KB", icon: FileSpreadsheet },
  { name: "FAQ.pdf", desc: "Agency frequently asked questions", size: "210 KB", icon: FileText },
];

export function DocumentsTab({ opp }: { opp: Opportunity }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>NOFO Package</CardTitle>
        <span className="text-xs text-muted-foreground">{opp.opportunityNumber}</span>
      </CardHeader>
      <ul className="divide-y divide-border border-t border-border">
        {PACKAGE.map((d) => (
          <li key={d.name} className="flex items-center gap-3 px-5 py-3">
            <span className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/60 text-muted-foreground">
              <d.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{d.name}</div>
              <div className="text-xs text-muted-foreground">
                {d.desc} · {d.size}
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={GRANTS_GOV} target="_blank" rel="noopener noreferrer">
                View on Grants.gov <ExternalLink />
              </a>
            </Button>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">Package files are referenced for demonstration; links open Grants.gov.</div>
    </Card>
  );
}
