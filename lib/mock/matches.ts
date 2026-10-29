import type { Client, GoNoGoAssessment, GrantMatch, MatchBreakdown, MatchStatus, Opportunity } from "../types";
import { computeMatch, recommendationFor } from "../matching";
import { isoFromNow } from "../utils";

interface MatchSeed {
  clientId: string;
  opportunityId: string;
  score: number;
  status: MatchStatus;
  applicationId?: string;
  breakdown?: MatchBreakdown;
  reasons?: string[];
  risks?: string[];
  daysAgo: number;
}

const SEEDS: MatchSeed[] = [
  {
    clientId: "c-horizon",
    opportunityId: "o-ctip",
    score: 86,
    status: "New",
    daysAgo: 1,
    breakdown: { organizationEligibility: 100, industryAlignment: 95, geographicFit: 100, fundingAlignment: 85, pastPerformance: 70, timelineFeasibility: 75 },
    reasons: [
      "Strong transportation alignment",
      "Eligible small-business classification",
      "Project fits stated funding priorities",
      "Budget range fits client target",
    ],
    risks: ["Limited documented federal past performance", "20% match requirement needs confirmation"],
  },
  {
    clientId: "c-horizon",
    opportunityId: "o-cwag",
    score: 67,
    status: "Reviewing",
    daysAgo: 4,
    breakdown: { organizationEligibility: 60, industryAlignment: 85, geographicFit: 100, fundingAlignment: 70, pastPerformance: 55, timelineFeasibility: 70 },
    reasons: [
      "Technician apprenticeship program aligns with workforce priorities",
      "Could participate as employer partner with a workforce board lead",
      "Service area within program geography",
    ],
    risks: [
      "Small businesses are not eligible as lead applicants — requires partner lead",
      "Limited documented federal past performance",
      "Award floor ($500K) exceeds stated workforce budget",
    ],
  },
  {
    clientId: "c-horizon",
    opportunityId: "o-rbmi",
    score: 38,
    status: "New",
    daysAgo: 2,
    breakdown: { organizationEligibility: 100, industryAlignment: 45, geographicFit: 10, fundingAlignment: 55, pastPerformance: 45, timelineFeasibility: 25 },
    reasons: ["Eligible small-business applicant type"],
    risks: [
      "Primary service area (DFW Metroplex) does not meet rural population threshold",
      "Only 9 days until deadline",
      "Program priorities emphasize agriculture and rural job creation",
    ],
  },
  { clientId: "c-horizon", opportunityId: "o-cefi", score: 88, status: "Application Started", applicationId: "a-003", daysAgo: 32 },
  { clientId: "c-horizon", opportunityId: "o-sbicp", score: 81, status: "Application Started", applicationId: "a-004", daysAgo: 11 },
  { clientId: "c-northstar", opportunityId: "o-dojcs", score: 91, status: "Application Started", applicationId: "a-001", daysAgo: 50 },
  { clientId: "c-northstar", opportunityId: "o-cwag", score: 52, status: "Dismissed", daysAgo: 20 },
  { clientId: "c-greenbridge", opportunityId: "o-rbmi", score: 89, status: "Application Started", applicationId: "a-002", daysAgo: 38 },
  { clientId: "c-greenbridge", opportunityId: "o-eedp", score: 22, status: "New", daysAgo: 5 },
  { clientId: "c-greenbridge", opportunityId: "o-farm", score: 63, status: "New", daysAgo: 7 },
  { clientId: "c-greenbridge", opportunityId: "o-sbicp", score: 72, status: "Reviewing", daysAgo: 9 },
  { clientId: "c-cascade", opportunityId: "o-cha", score: 90, status: "Application Started", applicationId: "a-005", daysAgo: 30 },
  { clientId: "c-cascade", opportunityId: "o-behavioral", score: 84, status: "New", daysAgo: 3 },
  { clientId: "c-ironworks", opportunityId: "o-cwag", score: 92, status: "Application Started", applicationId: "a-014", daysAgo: 24 },
  { clientId: "c-ironworks", opportunityId: "o-apprentice", score: 88, status: "Application Started", applicationId: "a-012", daysAgo: 262 },
  { clientId: "c-ironworks", opportunityId: "o-dswi", score: 71, status: "New", daysAgo: 6 },
  { clientId: "c-meridian", opportunityId: "o-mfg", score: 87, status: "Application Started", applicationId: "a-009", daysAgo: 78 },
  { clientId: "c-meridian", opportunityId: "o-sbir", score: 83, status: "New", daysAgo: 2 },
  { clientId: "c-meridian", opportunityId: "o-cefi", score: 48, status: "Dismissed", daysAgo: 15 },
  { clientId: "c-bluemesa", opportunityId: "o-eedp", score: 85, status: "Application Started", applicationId: "a-007", daysAgo: 8 },
  { clientId: "c-bluemesa", opportunityId: "o-tribalenergy", score: 93, status: "Reviewing", daysAgo: 1 },
  { clientId: "c-harborlight", opportunityId: "o-youth", score: 90, status: "Application Started", applicationId: "a-010", daysAgo: 245 },
  { clientId: "c-pinecrest", opportunityId: "o-econ", score: 89, status: "Application Started", applicationId: "a-011", daysAgo: 285 },
  { clientId: "c-pinecrest", opportunityId: "o-brownfield", score: 86, status: "Application Started", applicationId: "a-015", daysAgo: 12 },
  { clientId: "c-atlas", opportunityId: "o-dswi", score: 88, status: "Application Started", applicationId: "a-006", daysAgo: 42 },
  { clientId: "c-atlas", opportunityId: "o-broadband", score: 79, status: "New", daysAgo: 4 },
  { clientId: "c-atlas", opportunityId: "o-sbicp", score: 66, status: "New", daysAgo: 8 },
  { clientId: "c-riverbend", opportunityId: "o-farm", score: 91, status: "Application Started", applicationId: "a-008", daysAgo: 14 },
  { clientId: "c-riverbend", opportunityId: "o-rbmi", score: 74, status: "Reviewing", daysAgo: 6 },
  { clientId: "c-coastal", opportunityId: "o-coastal", score: 76, status: "Application Started", applicationId: "a-013", daysAgo: 225 },
  { clientId: "c-cascade", opportunityId: "o-dswi", score: 41, status: "New", daysAgo: 10 },
];

/** Shape a breakdown around a target score with a deterministic spread. */
function synthBreakdown(score: number, eligible: boolean, seed: number): MatchBreakdown {
  const spread = [8, 5, 10, -2, -12, -6];
  const rot = (i: number) => spread[(i + seed) % spread.length];
  const clamp = (v: number) => Math.max(5, Math.min(100, Math.round(v / 5) * 5));
  return {
    organizationEligibility: eligible ? 100 : 0,
    industryAlignment: clamp(score + rot(0)),
    geographicFit: clamp(Math.min(100, score + 15 + rot(1))),
    fundingAlignment: clamp(score + rot(2)),
    pastPerformance: clamp(score + rot(3) - 6),
    timelineFeasibility: clamp(score + rot(4)),
  };
}

const APPROVED_GO_NO_GO: GoNoGoAssessment = {
  scores: { eligibility: 2, strategicAlignment: 2, competitivePosition: 1, resourceReadiness: 2, deadlineFeasibility: 2 },
  notes: "Approved by client and Managing Director. Cost share confirmed in writing.",
  approved: true,
  approvedBy: "u-sarah",
  approvedAt: isoFromNow(-20),
  updatedAt: isoFromNow(-20),
};

export function buildMatches(clients: Client[], opps: Opportunity[]): GrantMatch[] {
  return SEEDS.map((s, i) => {
    const client = clients.find((c) => c.id === s.clientId)!;
    const opp = opps.find((o) => o.id === s.opportunityId)!;
    const computed = computeMatch(client, opp);
    const eligible = opp.eligibility.includes(client.organizationType);
    const breakdown = s.breakdown ?? synthBreakdown(s.score, eligible, i);
    const id = s.applicationId ? `m-${s.applicationId}` : `m-${s.clientId.slice(2)}-${s.opportunityId.slice(2)}`;
    return {
      id,
      clientId: s.clientId,
      opportunityId: s.opportunityId,
      score: s.score,
      breakdown,
      recommendation: recommendationFor(s.score, eligible),
      reasons: s.reasons ?? computed.reasons,
      risks: s.risks ?? (computed.risks.length ? computed.risks : ["Competitive national applicant pool"]),
      status: s.status,
      applicationId: s.applicationId,
      goNoGo: s.applicationId ? { ...APPROVED_GO_NO_GO, approvedAt: isoFromNow(-s.daysAgo + 2), updatedAt: isoFromNow(-s.daysAgo + 2) } : undefined,
      createdAt: isoFromNow(-s.daysAgo, 8),
    };
  });
}
