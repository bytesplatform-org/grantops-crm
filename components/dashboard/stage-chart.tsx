"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AppData } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { stageCounts } from "./dashboard-metrics";

function StageTip({ active, payload }: { active?: boolean; payload?: { payload: { stage: string; count: number } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl bg-dark px-3 py-2 text-[12px] text-white shadow-lg">
      <div className="text-zinc-400">{p.stage}</div>
      <div className="mt-0.5 text-[14px] font-semibold tabular">
        {p.count} application{p.count === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export function StageChart({ data, awardRate, decided, awarded }: { data: AppData; awardRate: number; decided: number; awarded: number }) {
  const rows = stageCounts(data);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Applications by Stage</CardTitle>
      </CardHeader>
      <div className="h-[190px] px-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f0f0f2" />
            <XAxis dataKey="stage" interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717a" }} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717a" }} width={36} />
            <Tooltip content={<StageTip />} cursor={{ fill: "#f4f4f5", radius: 6 }} />
            <Bar dataKey="count" fill="#202327" activeBar={{ fill: "#65a30d" }} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="m-5 mt-4 flex items-end justify-between rounded-xl bg-zinc-50 px-4 py-3">
        <div>
          <div className="text-[26px] font-bold tracking-tight tabular">{awardRate}%</div>
          <div className="text-[13px] text-muted-foreground">Award rate</div>
        </div>
        <div className="text-right text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground tabular">{awarded}</span> awarded of <span className="tabular">{decided}</span> decided
        </div>
      </div>
    </Card>
  );
}
