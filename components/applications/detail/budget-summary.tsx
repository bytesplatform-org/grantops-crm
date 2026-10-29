"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateBudgetSettings } from "@/lib/data-service";
import { budgetTotals } from "@/lib/selectors";
import { BUDGET_CATEGORIES, type ApplicationBudget, type Opportunity } from "@/lib/types";
import { cn, formatCurrency, wordCount } from "@/lib/utils";

const CAT_COLORS = ["#1f4fd1", "#60a5fa", "#0ea5e9", "#7c3aed", "#14b8a6", "#f59e0b", "#94a3b8", "#cbd5e1"];

export function BudgetSummary({ budget, opp }: { budget: ApplicationBudget; opp?: Opportunity }) {
  const t = budgetTotals(budget);
  const cards = [
    { label: "Direct Costs", value: formatCurrency(t.directCosts) },
    { label: "Indirect Costs", value: formatCurrency(t.indirectCosts) },
    { label: "Total Project Cost", value: formatCurrency(t.totalProjectCost), strong: true },
    { label: "Federal Request", value: formatCurrency(t.federalRequest), accent: true },
    { label: "Client Match", value: formatCurrency(t.clientMatch) },
    { label: "Match %", value: `${budget.matchPct}%` },
  ];
  const warnings: string[] = [];
  if (opp && t.federalRequest > opp.awardCeiling) warnings.push(`Federal request exceeds the award ceiling of ${formatCurrency(opp.awardCeiling)}.`);
  if (opp && t.federalRequest < opp.awardFloor) warnings.push(`Federal request is below the award floor of ${formatCurrency(opp.awardFloor)}.`);
  if (opp && budget.matchPct < opp.costSharePct) warnings.push(`Match of ${budget.matchPct}% is below the required ${opp.costSharePct}% cost share.`);
  const review = budget.items.filter((i) => i.allowable !== "Yes").length;
  if (review) warnings.push(`${review} line item${review > 1 ? "s" : ""} flagged for allowability review.`);
  const segments = [...BUDGET_CATEGORIES.map((c) => ({ label: c, value: t.byCategory[c] ?? 0 })), { label: "Indirect", value: t.indirectCosts }].filter((s) => s.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label} className={cn("p-4", c.accent && "border-primary/30 bg-primary-soft/50")}>
            <div className="text-xs font-medium text-muted-foreground">{c.label}</div>
            <div className={cn("mt-1.5 text-lg font-semibold tracking-tight tabular", c.accent && "text-primary")}>{c.value}</div>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium">Cost breakdown by category</span>
          <span className="text-muted-foreground">{formatCurrency(t.totalProjectCost)} total</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {segments.map((s, i) => (
            <div key={s.label} title={`${s.label}: ${formatCurrency(s.value)}`} style={{ width: `${(s.value / Math.max(1, t.totalProjectCost)) * 100}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {segments.map((s, i) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
              {s.label} <span className="font-medium text-foreground tabular">{Math.round((s.value / Math.max(1, t.totalProjectCost)) * 100)}%</span>
            </span>
          ))}
        </div>
        {warnings.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
            {warnings.map((w) => (
              <li key={w} className="flex items-center gap-2 text-[13px] text-amber-800">
                <AlertTriangle className="size-3.5 shrink-0 text-amber-500" /> {w}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function BudgetNarrative({ appId, narrative }: { appId: string; narrative: string }) {
  const [text, setText] = useState(narrative);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Budget narrative</CardTitle>
          <CardDescription>Justify each cost category and identify the source of matching funds</CardDescription>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          {saving === "saving" && <><Loader2 className="size-3 animate-spin" /> Saving…</>}
          {saving === "saved" && <><Check className="size-3 text-emerald-600" /> Saved</>}
          <span className="tabular">{wordCount(text)} words</span>
        </span>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={12}
          value={text}
          className="font-[450] leading-relaxed"
          placeholder="Personnel: … Fringe: … Equipment: …"
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            setSaving("saving");
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              updateBudgetSettings(appId, { narrative: v });
              setSaving("saved");
            }, 600);
          }}
        />
      </CardContent>
    </Card>
  );
}
