"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { removeBudgetItem, updateBudgetItem } from "@/lib/data-service";
import { lineTotal } from "@/lib/selectors";
import type { BudgetItem } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Select } from "@/components/ui/select";

const cellInput = "h-7 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] hover:border-border focus:border-ring focus:bg-card focus:outline-none";

function CommitInput({ value, onCommit, numeric, className, label }: { value: string | number; onCommit: (v: string) => void; numeric?: boolean; className?: string; label: string }) {
  const [v, setV] = useState(String(value));
  return (
    <input
      aria-label={label}
      inputMode={numeric ? "decimal" : undefined}
      value={v}
      onChange={(e) => setV(numeric ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value)}
      onBlur={() => {
        if (v !== String(value)) onCommit(v);
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={cn(cellInput, numeric && "text-right tabular", className)}
    />
  );
}

export function BudgetRow({ appId, item }: { appId: string; item: BudgetItem }) {
  const set = (patch: Partial<BudgetItem>) => updateBudgetItem(appId, item.id, patch);
  return (
    <tr className="group border-b border-border hover:bg-muted/30">
      <td className="py-1 pl-5 pr-2">
        <CommitInput key={item.description} label="Description" value={item.description} onCommit={(v) => set({ description: v })} />
      </td>
      <td className="w-20 px-1 py-1">
        <CommitInput key={`q${item.quantity}`} label="Quantity" numeric value={item.quantity} onCommit={(v) => set({ quantity: Number(v) || 0 })} />
      </td>
      <td className="w-28 px-1 py-1">
        <CommitInput key={`r${item.rate}`} label="Rate" numeric value={item.rate} onCommit={(v) => set({ rate: Number(v) || 0 })} />
      </td>
      <td className="w-32 px-3 py-1 text-right font-medium tabular">{formatCurrency(lineTotal(item))}</td>
      <td className="w-28 px-1 py-1">
        <Select
          aria-label="Allowable"
          value={item.allowable}
          onValueChange={(v) => set({ allowable: v as BudgetItem["allowable"] })}
          className={cn(
            "h-7 rounded-md border px-1.5 text-xs font-medium focus:outline-none",
            item.allowable === "Yes" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            item.allowable === "Review" && "border-amber-200 bg-amber-50 text-amber-700",
            item.allowable === "No" && "border-red-200 bg-red-50 text-red-700",
          )}
        >
          <option>Yes</option>
          <option>Review</option>
          <option>No</option>
        </Select>
      </td>
      <td className="px-1 py-1">
        <CommitInput key={`n${item.notes}`} label="Notes" value={item.notes} onCommit={(v) => set({ notes: v })} className="text-muted-foreground" />
      </td>
      <td className="w-10 pr-3 text-right">
        <button aria-label="Remove line" onClick={() => removeBudgetItem(appId, item.id)} className="rounded p-1 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100">
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}

export { CommitInput };
