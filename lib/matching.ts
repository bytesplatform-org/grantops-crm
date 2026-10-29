// Client ↔ opportunity matching heuristics. Deterministic, explainable scoring
// that can later be replaced by a server-side model behind the same signature.
import type { Client, GoNoGoAssessment, GoNoGoCriterion, GrantMatch, MatchBreakdown, MatchRecommendation, Opportunity } from "./types";
import { daysUntil, formatCompactCurrency } from "./utils";

export const BREAKDOWN_LABELS: Record<keyof MatchBreakdown, string> = {
  organizationEligibility: "Organization Eligibility",
  industryAlignment: "Industry Alignment",
  geographicFit: "Geographic Fit",
  fundingAlignment: "Funding Need Alignment",
  pastPerformance: "Past Performance",
  timelineFeasibility: "Timeline Feasibility",
};

const WEIGHTS: Record<keyof MatchBreakdown, number> = {
  organizationEligibility: 0.22,
  industryAlignment: 0.22,
  geographicFit: 0.14,
  fundingAlignment: 0.16,
  pastPerformance: 0.12,
  timelineFeasibility: 0.14,
};

export function weightedScore(b: MatchBreakdown): number {
  if (b.organizationEligibility === 0) return Math.min(25, Math.round(Object.values(b).reduce((a, v) => a + v, 0) / 6 / 3));
  return Math.round((Object.keys(WEIGHTS) as (keyof MatchBreakdown)[]).reduce((sum, k) => sum + b[k] * WEIGHTS[k], 0));
}

export function recommendationFor(score: number, eligible = true): MatchRecommendation {
  if (!eligible) return "Not Eligible";
  if (score >= 80) return "Pursue";
  if (score >= 60) return "Investigate";
  return "Low Priority";
}

function overlap(a: string[], b: string[]): number {
  const A = a.map((s) => s.toLowerCase());
  return b.filter((x) => A.some((y) => y.includes(x.toLowerCase()) || x.toLowerCase().includes(y))).length;
}

export function computeMatch(client: Client, opp: Opportunity): Omit<GrantMatch, "id" | "status" | "createdAt"> {
  const eligible = opp.eligibility.includes(client.organizationType);
  const keywordHits = overlap([...client.fundingProfile.keywords, ...client.fundingInterests, client.industry], [...opp.keywords, opp.category]);
  const industry = Math.min(100, 35 + keywordHits * 16);
  const geo = !opp.eligibleStates || opp.eligibleStates.includes(client.state) ? (opp.category === "Rural Development" && !/rural/i.test(client.serviceArea) ? 30 : 100) : 0;
  const target = client.fundingProfile.targetAmount;
  const funding = opp.awardCeiling >= target * 0.3 && opp.awardFloor <= target ? (opp.awardCeiling >= target * 0.5 ? 90 : 72) : 40;
  const past = client.fundingProfile.pastAwards.some((a) => a.agency === opp.agency) ? 90 : client.fundingProfile.pastAwards.length ? 65 : 45;
  const days = daysUntil(opp.deadline);
  const timeline = days < 0 ? 0 : days < 10 ? 35 : days < 21 ? 60 : days < 35 ? 78 : 92;
  const costShareOk = opp.costSharePct <= client.fundingProfile.matchCapacityPct;
  const breakdown: MatchBreakdown = {
    organizationEligibility: eligible ? 100 : 0,
    industryAlignment: industry,
    geographicFit: geo,
    fundingAlignment: costShareOk ? funding : Math.max(30, funding - 25),
    pastPerformance: past,
    timelineFeasibility: timeline,
  };
  const score = weightedScore(breakdown);
  const reasons: string[] = [];
  const risks: string[] = [];
  if (eligible) reasons.push(`Eligible applicant type (${client.organizationType})`);
  if (industry >= 80) reasons.push(`Strong ${opp.category.toLowerCase()} alignment with stated funding interests`);
  if (geo === 100) reasons.push(`Service area in ${client.state} is within program geography`);
  if (funding >= 72) reasons.push(`Award range (${formatCompactCurrency(opp.awardFloor)}–${formatCompactCurrency(opp.awardCeiling)}) fits client target`);
  if (past >= 90) reasons.push(`Prior award history with ${opp.agency}`);
  if (!eligible) risks.push(`${client.organizationType} is not a listed eligible applicant type`);
  if (industry < 60) risks.push("Limited alignment between program priorities and client focus areas");
  if (geo < 100) risks.push("Geographic eligibility needs confirmation");
  if (!costShareOk) risks.push(`${opp.costSharePct}% cost share exceeds client's stated capacity (${client.fundingProfile.matchCapacityPct}%)`);
  else if (opp.costSharePct > 0) risks.push(`${opp.costSharePct}% match requirement needs confirmation`);
  if (past < 70) risks.push("Limited documented federal past performance");
  if (timeline < 60) risks.push(`Only ${Math.max(0, days)} days until deadline`);
  return {
    clientId: client.id,
    opportunityId: opp.id,
    score,
    breakdown,
    recommendation: recommendationFor(score, eligible),
    reasons: reasons.length ? reasons : ["Partial alignment with client profile"],
    risks,
  };
}

// ---------------------------------------------------------------- Go / No-Go

export const GO_NO_GO_CRITERIA: { key: GoNoGoCriterion; label: string; hint: string }[] = [
  { key: "eligibility", label: "Eligibility", hint: "Applicant type, registrations, and geography confirmed against the NOFO." },
  { key: "strategicAlignment", label: "Strategic Alignment", hint: "Project advances the client's stated funding priorities." },
  { key: "competitivePosition", label: "Competitive Position", hint: "Past performance, partnerships, and differentiators versus likely applicants." },
  { key: "resourceReadiness", label: "Resource Readiness", hint: "Staff, cost share, documents, and partner letters can be secured in time." },
  { key: "deadlineFeasibility", label: "Deadline Feasibility", hint: "Enough runway to produce a high-quality submission." },
];

export function goNoGoTotal(a?: GoNoGoAssessment): number {
  if (!a) return 0;
  return Object.values(a.scores).reduce<number>((s, v) => s + (v ?? 0), 0);
}

export function goNoGoComplete(a?: GoNoGoAssessment): boolean {
  return !!a && Object.values(a.scores).every((v) => v !== null);
}

export function goNoGoRecommendation(total: number): "Pursue" | "Investigate" | "Too Early / No-Go" {
  if (total >= 8) return "Pursue";
  if (total >= 5) return "Investigate";
  return "Too Early / No-Go";
}

export function emptyGoNoGo(): GoNoGoAssessment {
  return {
    scores: { eligibility: null, strategicAlignment: null, competitivePosition: null, resourceReadiness: null, deadlineFeasibility: null },
    notes: "",
    approved: false,
    updatedAt: new Date().toISOString(),
  };
}
