import type { AppData, Application } from "@/lib/types";
import { isActive } from "@/lib/selectors";
import { daysUntil } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

/** Same population as the "Funding Pursued" KPI: active or submitted applications. */
const isPursued = (a: Application) => isActive(a) || a.status === "Submitted";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type TrendRange = "7D" | "30D" | "90D" | "1Y";
export type TrendMetric = "value" | "count";

const RANGE: Record<TrendRange, { days: number; step: number }> = {
  "7D": { days: 7, step: 1 },
  "30D": { days: 30, step: 1 },
  "90D": { days: 90, step: 3 },
  "1Y": { days: 364, step: 7 },
};

/**
 * Cumulative pipeline over time: for each date, the funding requested (or count)
 * of today's pursued applications that had been opened by then. The last point
 * equals the Funding Pursued KPI.
 */
export function pipelineSeries(data: AppData, range: TrendRange, metric: TrendMetric) {
  const { days, step } = RANGE[range];
  const apps = data.applications.filter(isPursued).map((a) => ({ t: +new Date(a.createdAt), v: a.fundingRequested }));
  const end = startOfToday().getTime() + DAY - 1;
  const points: { date: number; value: number }[] = [];
  for (let back = days; back >= 0; back -= step) {
    const t = end - back * DAY;
    const opened = apps.filter((a) => a.t <= t);
    points.push({ date: t, value: metric === "value" ? opened.reduce((s, a) => s + a.v, 0) : opened.length });
  }
  return points;
}

export function kpiTrends(data: AppData) {
  const since = Date.now() - 30 * DAY;
  const recent = (a: Application) => +new Date(a.createdAt) >= since;
  const activeApps = data.applications.filter(isActive);
  const activeClients = data.clients.filter((c) => c.status === "Active" || c.status === "Onboarding");
  const withOpenApp = activeClients.filter((c) => activeApps.some((a) => a.clientId === c.id));
  const dueIn = (from: number, to: number) =>
    activeApps.filter((a) => {
      const d = daysUntil(a.deadline);
      return d >= from && d < to;
    }).length;
  return {
    fundingAdded30: data.applications.filter((a) => isPursued(a) && recent(a)).reduce((s, a) => s + a.fundingRequested, 0),
    fundingBars: pipelineSeries(data, "90D", "value").filter((_, i, xs) => i % 3 === 0 || i === xs.length - 1).map((p) => p.value),
    appsOpened30: activeApps.filter(recent).length,
    appsSpark: pipelineSeries(data, "90D", "count").map((p) => p.value),
    onboarding: data.clients.filter((c) => c.status === "Onboarding").length,
    clientCoverage: activeClients.length ? Math.round((withOpenApp.length / activeClients.length) * 100) : 0,
    dueNext7: dueIn(0, 8),
    dueByWeek: Array.from({ length: 8 }, (_, w) => dueIn(w * 7, w * 7 + 7)),
  };
}

/** Applications per pipeline stage, for the stage chart. */
export const STAGE_BUCKETS: { label: string; statuses: Application["status"][] }[] = [
  { label: "Researching", statuses: ["Researching"] },
  { label: "Eligibility", statuses: ["Eligibility Confirmed", "Preparing"] },
  { label: "Writing", statuses: ["Writing"] },
  { label: "Review", statuses: ["Internal Review", "Client Review"] },
  { label: "Ready", statuses: ["Ready to Submit"] },
  { label: "Submitted", statuses: ["Submitted"] },
  { label: "Awarded", statuses: ["Awarded"] },
];

export function stageCounts(data: AppData) {
  return STAGE_BUCKETS.map((b) => ({ stage: b.label, count: data.applications.filter((a) => b.statuses.includes(a.status)).length }));
}

const AVATAR_TONES = ["bg-dark", "bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-zinc-500", "bg-amber-500"];

/** Stable avatar color for an organization, derived from its id. */
export function orgTone(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
