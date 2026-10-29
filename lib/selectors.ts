// Pure derived-data helpers shared by pages. No side effects.
import type { AppData, Application, ApplicationBudget, ApplicationStatus, BudgetItem, ChecklistKey, GrantMatch } from "./types";
import { CHECKLIST_ITEMS } from "./types";
import { daysUntil } from "./utils";

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "Researching",
  "Eligibility Confirmed",
  "Preparing",
  "Writing",
  "Internal Review",
  "Client Review",
  "Ready to Submit",
];
export const CLOSED_STATUSES: ApplicationStatus[] = ["Awarded", "Not Awarded", "Withdrawn"];

export function isActive(app: Application) {
  return ACTIVE_STATUSES.includes(app.status);
}

export function lineTotal(i: BudgetItem) {
  return (Number(i.quantity) || 0) * (Number(i.rate) || 0);
}

export interface BudgetTotals {
  byCategory: Record<string, number>;
  directCosts: number;
  equipment: number;
  indirectBase: number;
  indirectCosts: number;
  totalProjectCost: number;
  federalRequest: number;
  clientMatch: number;
  matchPct: number;
}

export function budgetTotals(b: ApplicationBudget): BudgetTotals {
  const byCategory: Record<string, number> = {};
  for (const i of b.items) byCategory[i.category] = (byCategory[i.category] ?? 0) + lineTotal(i);
  const directCosts = b.items.reduce((s, i) => s + lineTotal(i), 0);
  const equipment = byCategory["Equipment"] ?? 0;
  const indirectBase = directCosts - equipment;
  const indirectCosts = Math.round(indirectBase * (b.indirectRatePct / 100));
  const totalProjectCost = directCosts + indirectCosts;
  const clientMatch = Math.round(totalProjectCost * (b.matchPct / 100));
  return {
    byCategory,
    directCosts,
    equipment,
    indirectBase,
    indirectCosts,
    totalProjectCost,
    federalRequest: totalProjectCost - clientMatch,
    clientMatch,
    matchPct: b.matchPct,
  };
}

/** Weighted completion: checklist 50%, sections 30%, compliance 20%. */
export function applicationCompletion(app: Application): number {
  if (app.status === "Submitted" || app.status === "Awarded" || app.status === "Not Awarded") return 100;
  const keys = CHECKLIST_ITEMS.map((c) => c.key) as ChecklistKey[];
  const checklist = keys.filter((k) => app.checklist[k]).length / keys.length;
  const secWeights = { "Not Started": 0, Drafting: 0.45, "In Review": 0.8, Complete: 1 } as const;
  const sections = app.sections.length ? app.sections.reduce((s, x) => s + secWeights[x.status], 0) / app.sections.length : 0;
  const compliance = app.compliance.length
    ? app.compliance.reduce((s, c) => s + (c.status === "Complete" ? 1 : c.status === "Needs Review" ? 0.7 : c.status === "In Progress" ? 0.4 : 0), 0) / app.compliance.length
    : 0;
  return Math.round((checklist * 0.5 + sections * 0.3 + compliance * 0.2) * 100);
}

export function missingDocumentsCount(app: Application): number {
  return app.compliance.filter((c) => c.status === "Missing" && c.assignedSection === "Documents").length;
}

export function complianceSummary(app: Application) {
  const c = app.compliance;
  return {
    total: c.length,
    complete: c.filter((x) => x.status === "Complete").length,
    inProgress: c.filter((x) => x.status === "In Progress").length,
    needsReview: c.filter((x) => x.status === "Needs Review").length,
    missing: c.filter((x) => x.status === "Missing").length,
  };
}

export function eligibilityLabel(m?: GrantMatch): "Eligible" | "Likely Eligible" | "Needs Review" | "Not Eligible" {
  if (!m) return "Needs Review";
  if (m.breakdown.organizationEligibility === 0) return "Not Eligible";
  if (m.breakdown.geographicFit < 60) return "Needs Review";
  if (m.breakdown.organizationEligibility === 100 && m.breakdown.geographicFit === 100) return "Eligible";
  return "Likely Eligible";
}

export function riskFromMatch(m: GrantMatch): "Low" | "Medium" | "High" {
  if (m.score >= 80 && m.risks.length <= 2) return "Low";
  if (m.score >= 60) return "Medium";
  return "High";
}

// ---- lookups

export const byId = <T extends { id: string }>(xs: T[], id?: string) => (id ? xs.find((x) => x.id === id) : undefined);

export function memberName(data: AppData, id?: string) {
  if (!id) return "Unassigned";
  if (id === "client") return "Client";
  if (id === "system") return "GrantOS";
  return data.team.find((t) => t.id === id)?.name ?? "Unknown";
}

export function upcomingDeadlines(data: AppData, limit = 5) {
  return data.applications
    .filter((a) => isActive(a) && daysUntil(a.deadline) >= 0)
    .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
    .slice(0, limit);
}

export function dashboardKpis(data: AppData) {
  const active = data.applications.filter(isActive);
  const pursued = data.applications.filter((a) => isActive(a) || a.status === "Submitted");
  const awarded = data.applications.filter((a) => a.status === "Awarded");
  const decided = data.applications.filter((a) => a.status === "Awarded" || a.status === "Not Awarded");
  return {
    activeClients: data.clients.filter((c) => c.status === "Active" || c.status === "Onboarding").length,
    activeApplications: active.length,
    matchedOpportunities: data.matches.filter((m) => m.status !== "Dismissed").length,
    fundingPursued: pursued.reduce((s, a) => s + a.fundingRequested, 0),
    dueThisMonth: active.filter((a) => {
      const d = daysUntil(a.deadline);
      return d >= 0 && d <= 30;
    }).length,
    awardsWon: awarded.reduce((s, a) => s + (a.outcome?.amountAwarded ?? a.fundingRequested), 0),
    awardRate: decided.length ? Math.round((awarded.length / decided.length) * 100) : 0,
    fundingIdentified: data.matches
      .filter((m) => m.status !== "Dismissed")
      .reduce((s, m) => s + (data.opportunities.find((o) => o.id === m.opportunityId)?.awardCeiling ?? 0), 0),
  };
}

export const PIPELINE_STAGE_GROUPS: { label: string; statuses: ApplicationStatus[] }[] = [
  { label: "Researching", statuses: ["Researching"] },
  { label: "Eligibility", statuses: ["Eligibility Confirmed", "Preparing"] },
  { label: "Writing", statuses: ["Writing"] },
  { label: "Review", statuses: ["Internal Review", "Client Review"] },
  { label: "Ready to Submit", statuses: ["Ready to Submit"] },
  { label: "Submitted", statuses: ["Submitted"] },
  { label: "Awarded", statuses: ["Awarded"] },
];

export function pipelineByStage(data: AppData) {
  return PIPELINE_STAGE_GROUPS.map((g) => {
    const apps = data.applications.filter((a) => g.statuses.includes(a.status));
    return { stage: g.label, amount: apps.reduce((s, a) => s + a.fundingRequested, 0), count: apps.length };
  });
}
