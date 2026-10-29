"use client";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppData } from "@/lib/types";
import { ACTIVE_STATUSES, pipelineByStage } from "@/lib/selectors";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

const STAGE_COLORS = ["#cbd5e1", "#93c5fd", "#1f4fd1", "#7c3aed", "#f59e0b", "#334155", "#059669"];

interface TipProps {
  active?: boolean;
  payload?: { value: number; payload: { stage?: string; name?: string; count?: number; amount?: number } }[];
}

function PipelineTip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{p.stage}</div>
      <div className="mt-0.5 text-muted-foreground">
        {formatCurrency(p.amount ?? 0)} · {p.count} application{p.count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export function PipelineChart({ data, height = 260 }: { data: AppData; height?: number }) {
  const rows = pipelineByStage(data);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef1f5" />
          <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} interval={0} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v: number) => formatCompactCurrency(v)} width={56} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} content={<PipelineTip />} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {rows.map((r, i) => (
              <Cell key={r.stage} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function outcomeRows(data: AppData) {
  const apps = data.applications;
  const sum = (xs: typeof apps) => xs.reduce((s, a) => s + a.fundingRequested, 0);
  const awarded = apps.filter((a) => a.status === "Awarded");
  const pending = apps.filter((a) => a.status === "Submitted" || ACTIVE_STATUSES.includes(a.status));
  const lost = apps.filter((a) => a.status === "Not Awarded");
  return [
    { name: "Awarded", count: awarded.length, amount: awarded.reduce((s, a) => s + (a.outcome?.amountAwarded ?? a.fundingRequested), 0), color: "#059669" },
    { name: "Pending", count: pending.length, amount: sum(pending), color: "#1f4fd1" },
    { name: "Not Awarded", count: lost.length, amount: sum(lost), color: "#e2e8f0" },
  ];
}

function OutcomeTip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{p.name}</div>
      <div className="mt-0.5 text-muted-foreground">
        {p.count} applications · {formatCurrency(p.amount ?? 0)}
      </div>
    </div>
  );
}

export function OutcomesDonut({ data, height = 200 }: { data: AppData; height?: number }) {
  const rows = outcomeRows(data);
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} stroke="none">
              {rows.map((r) => (
                <Cell key={r.name} fill={r.color} />
              ))}
            </Pie>
            <Tooltip content={<OutcomeTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular">{total}</span>
          <span className="text-[11px] text-muted-foreground">applications</span>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-sm" style={{ background: r.color === "#e2e8f0" ? "#cbd5e1" : r.color }} />
            <span className="flex-1 text-slate-700">{r.name}</span>
            <span className="tabular text-muted-foreground">{formatCompactCurrency(r.amount)}</span>
            <span className="w-6 text-right font-medium tabular">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
