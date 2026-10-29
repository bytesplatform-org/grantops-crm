"use client";
import { Fragment } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addBudgetItem, markBudgetComplete, updateBudgetSettings } from "@/lib/data-service";
import { budgetTotals } from "@/lib/selectors";
import { BUDGET_CATEGORIES } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { BudgetRow, CommitInput } from "./budget-row";
import { BudgetSummary, BudgetNarrative } from "./budget-summary";
import type { AppContext } from "./use-application";

export function BudgetBuilder({ ctx }: { ctx: AppContext }) {
  const { app, opp } = ctx;
  const t = budgetTotals(app.budget);
  return (
    <div className="space-y-5">
      <BudgetSummary budget={app.budget} opp={opp} />
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Budget builder</CardTitle>
            <CardDescription>SF-424A cost categories · edits recalculate totals and the federal request automatically</CardDescription>
          </div>
          {app.checklist.budgetCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" /> Budget complete</span>
          ) : (
            <Button size="sm" variant="success" onClick={() => { markBudgetComplete(app.id); toast.success("Budget marked complete"); }}>
              <CheckCircle2 /> Mark Budget Complete
            </Button>
          )}
        </CardHeader>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-y border-border bg-muted/60">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pl-7 pr-2">Description</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2">Allowable?</th>
                <th className="px-3 py-2">Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {BUDGET_CATEGORIES.map((cat) => {
                const items = app.budget.items.filter((i) => i.category === cat);
                return (
                  <Fragment key={cat}>
                    <tr className="border-b border-border bg-slate-50/80">
                      <td colSpan={3} className="py-2 pl-5 text-[13px] font-semibold">{cat}</td>
                      <td className="px-3 py-2 text-right text-[13px] font-semibold tabular">{formatCurrency(t.byCategory[cat] ?? 0)}</td>
                      <td colSpan={3} className="pr-3 text-right">
                        <Button variant="ghost" size="xs" onClick={() => addBudgetItem(app.id, cat)}>
                          <Plus /> Add line
                        </Button>
                      </td>
                    </tr>
                    {items.map((i) => (
                      <BudgetRow key={i.id} appId={app.id} item={i} />
                    ))}
                    {items.length === 0 && (
                      <tr className="border-b border-border">
                        <td colSpan={7} className="py-2 pl-7 text-xs text-muted-foreground">No {cat.toLowerCase()} costs.</td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              <tr className="border-b border-border bg-slate-50/80">
                <td className="py-2 pl-5 text-[13px] font-semibold">Indirect Costs</td>
                <td colSpan={2} className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                    Rate
                    <CommitInput key={`i${app.budget.indirectRatePct}`} label="Indirect rate" numeric value={app.budget.indirectRatePct} onCommit={(v) => updateBudgetSettings(app.id, { indirectRatePct: Number(v) || 0 })} className="w-14 border-border bg-card" />
                    % of MTDC
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-[13px] font-semibold tabular">{formatCurrency(t.indirectCosts)}</td>
                <td colSpan={3} className="px-3 text-xs text-muted-foreground">Base {formatCurrency(t.indirectBase)} (direct costs excluding equipment)</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-muted/60">
                <td className="py-3 pl-5 text-sm font-semibold">Total Project Cost</td>
                <td colSpan={2} className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                    Client match
                    <CommitInput key={`m${app.budget.matchPct}`} label="Match percent" numeric value={app.budget.matchPct} onCommit={(v) => updateBudgetSettings(app.id, { matchPct: Math.min(100, Number(v) || 0) })} className="w-14 border-border bg-card" />
                    %
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold tabular">{formatCurrency(t.totalProjectCost)}</td>
                <td colSpan={3} className="px-3 text-xs text-muted-foreground">
                  Federal {formatCurrency(t.federalRequest)} · Match {formatCurrency(t.clientMatch)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      <BudgetNarrative appId={app.id} narrative={app.budget.narrative} />
    </div>
  );
}
