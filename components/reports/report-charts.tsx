"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppData } from "@/lib/types";
import { daysUntil, formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { isActive } from "@/lib/selectors";

interface TipProps {
  active?: boolean;
  label?: string;
  payload?: { value: number; payload: { label: string; amount: number; count: number } }[];
}

function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{p.label}</div>
      <div className="mt-0.5 text-muted-foreground">
        {formatCurrency(p.amount)} · {p.count} application{p.count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

const SHORT: Record<string, string> = {
  "Department of Health and Human Services": "HHS",
  "Department of Transportation": "DOT",
  "Department of Energy": "DOE",
  "Department of Labor": "DOL",
  "Department of Justice": "DOJ",
  "Department of Commerce": "Commerce",
  "Department of Agriculture": "USDA",
  "Small Business Administration": "SBA",
  "Environmental Protection Agency": "EPA",
  "National Science Foundation": "NSF",
  "Department of the Interior": "Interior",
};

export function fundingByAgency(data: AppData) {
  const map = new Map<string, { label: string; amount: number; count: number }>();
  for (const a of data.applications) {
    if (a.status === "Withdrawn") continue;
    const agency = data.opportunities.find((o) => o.id === a.opportunityId)?.agency ?? "Other";
    const label = SHORT[agency] ?? agency;
    const row = map.get(label) ?? { label, amount: 0, count: 0 };
    row.amount += a.fundingRequested;
    row.count += 1;
    map.set(label, row);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export function AgencyChart({ data }: { data: AppData }) {
  const rows = fundingByAgency(data);
  return (
    <div style={{ height: Math.max(220, rows.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#eef1f5" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => formatCompactCurrency(v)} />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#475569" }} width={76} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Tip />} />
          <Bar dataKey="amount" fill="#1f4fd1" radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Active application funding grouped by week over the next 60 days. */
export function deadlineWeeks(data: AppData) {
  const weeks = Array.from({ length: 9 }, (_, i) => ({ label: i === 0 ? "This wk" : `+${i}w`, amount: 0, count: 0 }));
  for (const a of data.applications.filter(isActive)) {
    const d = daysUntil(a.deadline);
    if (d < 0 || d > 60) continue;
    const w = weeks[Math.floor(d / 7)];
    w.amount += a.fundingRequested;
    w.count += 1;
  }
  return weeks;
}

export function DeadlineWeeksChart({ data }: { data: AppData }) {
  const rows = deadlineWeeks(data);
  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef1f5" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => formatCompactCurrency(v)} width={56} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} content={<Tip />} />
          <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
