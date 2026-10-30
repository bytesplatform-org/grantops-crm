"use client";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppData } from "@/lib/types";
import { cn, formatCompactCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { pipelineSeries, type TrendMetric, type TrendRange } from "./dashboard-metrics";

const RANGES: TrendRange[] = ["7D", "30D", "90D", "1Y"];
const LINE = "#65a30d";
const FILL = "#c8f03c";

const fmtDate = (t: number, withYear = false) =>
  new Date(t).toLocaleDateString("en-US", withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });

function TrendTip({ active, payload, metric }: { active?: boolean; payload?: { payload: { date: number; value: number } }[]; metric: TrendMetric }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-dark px-3.5 py-2.5 text-white shadow-lg">
      <div className="text-[12px] text-zinc-400">{fmtDate(p.date, true)}</div>
      <div className="mt-1 flex items-center gap-2 text-[15px] font-semibold tabular">
        <span className="size-2 rounded-full bg-brand" />
        {metric === "value" ? formatCompactCurrency(p.value) : `${p.value} applications`}
      </div>
    </div>
  );
}

export function PipelineTrend({ data }: { data: AppData }) {
  const [range, setRange] = useState<TrendRange>("90D");
  const [metric, setMetric] = useState<TrendMetric>("value");
  const points = useMemo(() => pipelineSeries(data, range, metric), [data, range, metric]);
  const fmt = (v: number) => (metric === "value" ? formatCompactCurrency(v) : String(v));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center">
        <CardTitle>Pipeline Value Trend</CardTitle>
        <Select aria-label="Metric" value={metric} onChange={(e) => setMetric(e.target.value as TrendMetric)} className="h-9 w-auto rounded-[10px] text-[13px]">
          <option value="value">Funding requested</option>
          <option value="count">Applications</option>
        </Select>
      </CardHeader>
      <div className="min-h-[250px] flex-1 px-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="pipelineFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={FILL} stopOpacity={0.45} />
                <stop offset="100%" stopColor={FILL} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f0f0f2" />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t: number) => fmtDate(t)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#71717a" }}
              tickMargin={10}
              minTickGap={28}
            />
            <YAxis tickFormatter={fmt} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} width={52} allowDecimals={false} />
            <Tooltip content={<TrendTip metric={metric} />} cursor={{ stroke: "#a1a1aa", strokeDasharray: "3 3" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={LINE}
              strokeWidth={2}
              fill="url(#pipelineFill)"
              activeDot={{ r: 6, fill: FILL, stroke: LINE, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center px-5 pb-5 pt-3">
        <div role="group" aria-label="Time range" className="inline-flex gap-0.5 rounded-xl border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "h-7 rounded-lg px-3.5 text-[12px] font-medium transition-colors",
                range === r ? "bg-dark text-white" : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
