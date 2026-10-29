import type {
  Application,
  ApplicationBudget,
  ApplicationSection,
  ApplicationStatus,
  BudgetItem,
  ChecklistKey,
  Client,
  ComplianceRequirement,
  Opportunity,
  Review,
  SectionStatus,
} from "../types";
import { CHECKLIST_ITEMS } from "../types";
import { SECTION_DEFS, buildComplianceFromNofo, buildNofoAnalysis, draftSectionContent } from "../content-library";
import { budgetTotals } from "../selectors";
import { isoFromNow, uid } from "../utils";

export const STAGE_LEVEL: Record<ApplicationStatus, number> = {
  Researching: 0.05,
  "Eligibility Confirmed": 0.15,
  Preparing: 0.25,
  Writing: 0.5,
  "Internal Review": 0.75,
  "Client Review": 0.85,
  "Ready to Submit": 1,
  Submitted: 1,
  Awarded: 1,
  "Not Awarded": 1,
  Withdrawn: 0.4,
};

const CHECKLIST_COUNT: Record<ApplicationStatus, number> = {
  Researching: 0,
  "Eligibility Confirmed": 2,
  Preparing: 3,
  Writing: 4,
  "Internal Review": 6,
  "Client Review": 7,
  "Ready to Submit": 9,
  Submitted: 9,
  Awarded: 9,
  "Not Awarded": 9,
  Withdrawn: 3,
};

export function checklistFor(status: ApplicationStatus): Record<ChecklistKey, boolean> {
  const n = CHECKLIST_COUNT[status];
  return Object.fromEntries(CHECKLIST_ITEMS.map((c, i) => [c.key, i < n])) as Record<ChecklistKey, boolean>;
}

export function buildSections(
  ctx: { client: Client; opportunity: Opportunity; amount: number },
  level: number,
  writerId: string,
  daysAgoBase = 1,
): ApplicationSection[] {
  const n = SECTION_DEFS.length;
  const complete = level >= 1 ? n : Math.floor(level * n * 0.9);
  return SECTION_DEFS.map((def, i) => {
    let status: SectionStatus = "Not Started";
    if (i < complete) status = "Complete";
    else if (level > 0.3 && i < complete + 1) status = "In Review";
    else if (level > 0.2 && i < complete + 3) status = "Drafting";
    return {
      id: uid("sec"),
      key: def.key,
      title: def.title,
      content: status === "Not Started" ? "" : draftSectionContent(def.key, ctx),
      status,
      wordLimit: def.wordLimit,
      requirement: def.requirement,
      guidance: def.guidance,
      evidence: def.evidence,
      assigneeId: i % 3 === 2 ? "u-elena" : writerId,
      updatedAt: isoFromNow(-(daysAgoBase + i), 9 + (i % 6)),
    };
  });
}

function evidenceFor(req: ComplianceRequirement, clientShort: string): string {
  if (req.status === "Missing") return "—";
  if (req.status === "In Progress") return "Draft v2";
  if (req.status === "Needs Review") return "Draft v3 (in review)";
  if (/SF-/.test(req.requirement)) return `${req.requirement.split(" ")[0]}_${clientShort}.pdf`;
  if (/Budget/i.test(req.requirement)) return `${clientShort}_Budget_Final.xlsx`;
  if (/Letter/i.test(req.requirement)) return "3 of 3 received";
  if (/Resume/i.test(req.requirement)) return "Key_Personnel_Resumes.pdf";
  if (/Narrative|Statement|Plan|Goals/i.test(req.requirement)) return "Final v4";
  return `${req.requirement.replace(/[^A-Za-z]+/g, "_").slice(0, 28)}.pdf`;
}

export function buildCompliance(opp: Opportunity, level: number, clientShort: string): ComplianceRequirement[] {
  const analysis = buildNofoAnalysis(opp);
  const rows = buildComplianceFromNofo(analysis, () => "Missing");
  const n = rows.length;
  return rows.map((r, i) => {
    const p = ((i * 7) % n) / n;
    let status: ComplianceRequirement["status"] = "Missing";
    if (level >= 1 || p < level * 0.8) status = "Complete";
    else if (p < level) status = i % 2 ? "Needs Review" : "In Progress";
    else if (level < 0.1) status = "Missing";
    const row = { ...r, status };
    return { ...row, evidence: evidenceFor(row, clientShort) };
  });
}

// Reference budget (Horizon Fleet DOE application): $593,750 total / $475,000 federal / 20% match.
const HORIZON_BUDGET_ITEMS: Omit<BudgetItem, "id">[] = [
  { category: "Personnel", description: "Project Manager (0.5 FTE)", quantity: 0.5, rate: 92_000, allowable: "Yes", notes: "Annual salary, prorated by level of effort" },
  { category: "Personnel", description: "Fleet Technician Trainer (1.0 FTE)", quantity: 1, rate: 68_000, allowable: "Yes", notes: "New hire, Year 1" },
  { category: "Personnel", description: "Data & Reporting Analyst (0.25 FTE)", quantity: 0.25, rate: 76_000, allowable: "Yes", notes: "Emissions and performance reporting" },
  { category: "Fringe", description: "Fringe benefits @ 28% of personnel", quantity: 1, rate: 37_240, allowable: "Yes", notes: "Health, FICA, retirement" },
  { category: "Travel", description: "Program officer meetings & training site visits", quantity: 4, rate: 1_850, allowable: "Yes", notes: "Per trip, GSA rates" },
  { category: "Equipment", description: "Level 2/DC fast charging units", quantity: 5, rate: 24_500, allowable: "Yes", notes: "Vendor quote attached" },
  { category: "Equipment", description: "EV diagnostic & battery service stations", quantity: 2, rate: 50_000, allowable: "Yes", notes: "Unit cost > $5,000" },
  { category: "Supplies", description: "Technician tool kits & PPE", quantity: 20, rate: 518, allowable: "Yes", notes: "Per trainee" },
  { category: "Contractual", description: "Electrical installation contractor", quantity: 1, rate: 118_000, allowable: "Yes", notes: "Competitive procurement" },
  { category: "Contractual", description: "Independent evaluation consultant", quantity: 1, rate: 24_000, allowable: "Yes", notes: "Process & outcome evaluation" },
  { category: "Other", description: "Credential exam fees", quantity: 25, rate: 300, allowable: "Review", notes: "Confirm allowability with program officer" },
];

export function buildBudget(federalRequest: number, matchPct: number, narrative: string, exact = false): ApplicationBudget {
  const items = HORIZON_BUDGET_ITEMS.map((i) => ({ ...i, id: uid("bi") }));
  const base: ApplicationBudget = { items, indirectRatePct: 10, matchPct, narrative };
  if (exact) return base;
  const targetTotal = Math.round(federalRequest / (1 - matchPct / 100));
  const factor = targetTotal / 593_750;
  const scaled = items.map((i) =>
    i.category === "Fringe" || i.category === "Contractual" || i.category === "Personnel"
      ? { ...i, rate: Math.round((i.rate * factor) / 10) * 10 }
      : { ...i, quantity: i.category === "Equipment" ? i.quantity : i.quantity, rate: Math.round((i.rate * factor) / 10) * 10 },
  );
  const draft: ApplicationBudget = { ...base, items: scaled };
  const diff = targetTotal - budgetTotals(draft).totalProjectCost;
  // Equipment is excluded from the indirect base, so the residual lands 1:1 on the total.
  const eqIdx = scaled.findIndex((i) => i.category === "Equipment" && i.quantity === 2);
  scaled[eqIdx] = { ...scaled[eqIdx], rate: scaled[eqIdx].rate + diff / scaled[eqIdx].quantity };
  return draft;
}

// ---------------------------------------------------------------- Horizon DOE (hero application)

const HORIZON_SECTIONS: Record<string, { status: SectionStatus; content: string }> = {
  "executive-summary": {
    status: "Complete",
    content: `Horizon Fleet Services, a woman-owned small business headquartered in Fort Worth, Texas, requests $475,000 from the Department of Energy under the Clean Energy Fleet Deployment Initiative to establish the North Texas Clean Fleet Service Hub.

The project will install five Level 2 and DC fast charging units and two EV diagnostic and battery service stations at Horizon's primary service facility, and launch a 30-month technician training pathway that prepares 40 local workers to service electric and hybrid fleet vehicles.

Horizon currently maintains more than 1,100 municipal, school district, and commercial vehicles across Tarrant, Dallas, Denton, and Johnson counties. Fleet customers representing 310 vehicles have committed to electrification pilots but lack local service capacity. The Hub will close that gap, reducing an estimated 1,450 metric tons of CO₂e over the period of performance and creating 9 permanent technical jobs.

Horizon will contribute $118,750 (20% of total project cost) in cash and in-kind facility contributions.`,
  },
  "statement-of-need": {
    status: "In Review",
    content: `North Texas fleets are electrifying faster than the regional service workforce can support. The Dallas–Fort Worth region added an estimated 4,200 medium-duty electric and hybrid fleet vehicles in the last 24 months, while the number of technicians certified to service high-voltage systems grew by fewer than 60.

According to the 2025 Community Needs Assessment commissioned by the North Central Texas workforce region, fleet operators cited "lack of qualified EV service providers" as the top barrier to adoption. Municipal fleets in Tarrant County currently send EV units up to 70 miles for warranty service, adding an average of 6.5 days of downtime per repair.

Horizon's own service data confirm the need: in 2025, the company declined 212 service requests for electric and hybrid vehicles because of equipment and staffing constraints. Service area statistics show that 38% of residents in Horizon's primary ZIP codes live in census tracts identified as disadvantaged, where air-quality burdens from diesel fleet operations are highest.`,
  },
  "project-description": {
    status: "Drafting",
    content: `The North Texas Clean Fleet Service Hub has three integrated components aligned to program priorities.

Component 1 — Charging & Service Infrastructure. Horizon will install five charging units and two EV diagnostic and battery service stations at its 18,000 sq. ft. Fort Worth facility. Site control is documented through Horizon's long-term lease, and utility make-ready coordination with Oncor has begun.

Component 2 — Clean Fleet Technician Pathway. In partnership with Tarrant County College, Horizon will deliver a 16-week high-voltage safety and EV service curriculum. Participants earn industry-recognized credentials and complete 400 hours of paid on-the-job training.

Component 3 — Fleet Partner Electrification Support. Horizon will provide telematics-based utilization analysis to [partner fleets — confirm list with Cheyenne] to right-size their electrification plans.`,
  },
  "goals-objectives": {
    status: "Drafting",
    content: `Goal 1: Establish regional clean fleet service capacity.
• Objective 1.1: Commission all charging and diagnostic equipment within 9 months of award.
• Objective 1.2: Service 300 electric and hybrid fleet vehicles annually by Year 2.

Goal 2: Build a credentialed clean fleet workforce.
• Objective 2.1: Enroll 40 participants; 80% earn a high-voltage safety credential.
• Objective 2.2: Place 75% of completers in fleet technician roles within 90 days.

Goal 3: Reduce fleet emissions in North Texas.
• Objective 3.1: Avoid 1,450 metric tons CO₂e over the period of performance.`,
  },
  "implementation-plan": {
    status: "Drafting",
    content: `Quarter 1: Award setup, hire Fleet Technician Trainer, issue RFP for electrical installation.
Quarter 2: Complete make-ready and equipment installation; recruit Cohort 1.
Quarters 3–6: Deliver four training cohorts; begin expanded EV service operations.
Quarters 7–9: Scale to full service volume; mid-point evaluation.
Quarter 10: Summative evaluation and closeout.`,
  },
  "evaluation-plan": { status: "Not Started", content: "" },
  "organizational-capacity": {
    status: "Complete",
    content: `Since 2011, Horizon Fleet Services has grown from a single-bay repair shop into a 46-employee fleet maintenance provider serving 14 public and commercial fleet contracts. Horizon is certified as a Woman-Owned Small Business (WOSB) and maintains an active SAM.gov registration.

Key personnel include Cheyenne Brooks (Founder & CEO, 20+ years in fleet operations), Marcus Delgado (Director of Operations), and Renee Watkins (Controller), who oversees an accounting system that tracks costs by contract and funding source with monthly reconciliation.

Horizon managed an $85,000 Texas Skills Development Fund partnership in 2023, delivering 100% of training targets on schedule.`,
  },
  sustainability: { status: "Not Started", content: "" },
  "budget-narrative": {
    status: "Drafting",
    content: `Personnel ($133,000): Project Manager at 0.5 FTE ($92,000 annual), Fleet Technician Trainer at 1.0 FTE ($68,000), and Data & Reporting Analyst at 0.25 FTE ($76,000).

Fringe ($37,240): Calculated at Horizon's standard 28% fringe rate.

Travel ($7,400): Four trips for program officer meetings and partner training site visits at GSA per diem rates.

Equipment ($222,500): Five charging units at $24,500 each and two EV diagnostic and battery service stations at $50,000 each, based on vendor quotes.

Supplies ($10,360): Technician tool kits and PPE for 20 trainees.

Contractual ($142,000): Electrical installation contractor ($118,000) and independent evaluation consultant ($24,000).

Other ($7,500): Credential exam fees for 25 participants.

Indirect ($33,750): 10% de minimis rate applied to modified total direct costs (excluding equipment).

Cost Share ($118,750): Horizon will provide cash match from operating reserves and in-kind facility use.`,
  },
};

const HORIZON_COMPLIANCE: Omit<ComplianceRequirement, "id">[] = [
  { requirement: "SF-424 Application for Federal Assistance", source: "Section IV.A", assignedSection: "Federal Forms", evidence: "SF424_Horizon.pdf", ownerId: "u-david", status: "Complete" },
  { requirement: "SF-424A Budget Information", source: "Section IV.A", assignedSection: "Budget", evidence: "SF424A_Horizon.pdf", ownerId: "u-david", status: "Complete" },
  { requirement: "Project Abstract", source: "Section IV.B", assignedSection: "Executive Summary", evidence: "Final v2", ownerId: "u-maria", status: "Complete" },
  { requirement: "Project Narrative", source: "Section IV.B", assignedSection: "Project Description", evidence: "Draft v3", ownerId: "u-maria", status: "In Progress" },
  { requirement: "Statement of Need", source: "Section IV.B.1", assignedSection: "Statement of Need", evidence: "Draft v3 (in review)", ownerId: "u-maria", status: "Needs Review" },
  { requirement: "Goals, Objectives & Performance Measures", source: "Section IV.B.2", assignedSection: "Goals & Objectives", evidence: "Draft v2", ownerId: "u-maria", status: "In Progress" },
  { requirement: "Budget Narrative / Justification", source: "Section IV.C", assignedSection: "Budget", evidence: "Budget Draft.xlsx", ownerId: "u-david", status: "Needs Review" },
  { requirement: "Letters of Support (minimum 3)", source: "Attachment 6", assignedSection: "Documents", evidence: "2 of 3", ownerId: "client", status: "Missing" },
  { requirement: "Equipment Quotes", source: "Attachment 4", assignedSection: "Documents", evidence: "Vendor_Quotes_Charging.pdf", ownerId: "client", status: "Complete" },
  { requirement: "Site Control Documentation", source: "Attachment 5", assignedSection: "Documents", evidence: "Facility_Lease_Summary.pdf", ownerId: "client", status: "Complete" },
  { requirement: "Emissions Reduction Estimate", source: "Attachment 7", assignedSection: "Project Description", evidence: "Emissions_Model_v1.xlsx", ownerId: "u-james", status: "In Progress" },
  { requirement: "Key Personnel Resumes", source: "Attachment 2", assignedSection: "Documents", evidence: "Cheyenne_Brooks_Bio.docx", ownerId: "client", status: "Complete" },
  { requirement: "Organizational Chart", source: "Attachment 3", assignedSection: "Documents", evidence: "Organization_Chart.pdf", ownerId: "client", status: "Complete" },
  { requirement: "Most Recent Financial Statements", source: "Attachment 8", assignedSection: "Documents", evidence: "—", ownerId: "client", status: "Missing" },
  { requirement: "Cost Share Commitment Letter", source: "Section III.B", assignedSection: "Budget", evidence: "Signed 10/22", ownerId: "client", status: "Complete" },
  { requirement: "SF-LLL Disclosure of Lobbying Activities", source: "Section IV.A", assignedSection: "Federal Forms", evidence: "SFLLL_Horizon.pdf", ownerId: "u-priya", status: "Complete" },
  { requirement: "SAM.gov Registration Active", source: "Section III.A", assignedSection: "Eligibility", evidence: "Verified — active", ownerId: "u-priya", status: "Complete" },
  { requirement: "Organizational Capacity Narrative", source: "Section IV.B.5", assignedSection: "Organizational Capacity", evidence: "Final v2", ownerId: "u-maria", status: "Complete" },
];

// ---------------------------------------------------------------- Application seeds

interface AppSeed {
  id: string;
  opportunityId: string;
  clientId: string;
  status: ApplicationStatus;
  amount: number;
  writerId: string;
  managerId: string;
  risk: Application["risk"];
  nextAction: string;
  notes: string;
  createdDaysAgo: number;
  submittedDaysAgo?: number;
  trackingNumber?: string;
  outcome?: { decision: "Awarded" | "Not Awarded"; daysAgo: number; amount: number; notes: string };
}

const APP_SEEDS: AppSeed[] = [
  { id: "a-001", opportunityId: "o-dojcs", clientId: "c-northstar", status: "Ready to Submit", amount: 575_000, writerId: "u-maria", managerId: "u-sarah", risk: "Low", nextAction: "AOR submission in Grants.gov Workspace", notes: "Client AOR (Dr. Mitchell) confirmed availability for submission. Submit at least 48 hours before deadline.", createdDaysAgo: 48 },
  { id: "a-002", opportunityId: "o-rbmi", clientId: "c-greenbridge", status: "Internal Review", amount: 500_000, writerId: "u-elena", managerId: "u-david", risk: "Medium", nextAction: "Resolve internal review comments on evaluation plan", notes: "Rural eligibility confirmed for all 22 counties via USDA eligibility map.", createdDaysAgo: 36 },
  { id: "a-003", opportunityId: "o-cefi", clientId: "c-horizon", status: "Writing", amount: 475_000, writerId: "u-maria", managerId: "u-david", risk: "Medium", nextAction: "Collect third letter of support and 2025 financial statements", notes: "Cheyenne confirmed 20% cost share from operating reserves. Oncor make-ready timeline needs to be referenced in the narrative.", createdDaysAgo: 30 },
  { id: "a-004", opportunityId: "o-sbicp", clientId: "c-horizon", status: "Preparing", amount: 225_000, writerId: "u-elena", managerId: "u-david", risk: "Low", nextAction: "Finalize project scope with client", notes: "Scope focused on telematics platform modernization and technician upskilling.", createdDaysAgo: 9 },
  { id: "a-005", opportunityId: "o-cha", clientId: "c-cascade", status: "Writing", amount: 1_200_000, writerId: "u-maria", managerId: "u-sarah", risk: "Medium", nextAction: "Draft sustainability plan tied to Medicaid reimbursement", notes: "Two new mobile unit routes proposed in Josephine County.", createdDaysAgo: 28 },
  { id: "a-006", opportunityId: "o-dswi", clientId: "c-atlas", status: "Client Review", amount: 800_000, writerId: "u-elena", managerId: "u-sarah", risk: "Low", nextAction: "Client sign-off on final narrative", notes: "Lead applicant partnership with Maricopa County Workforce Board confirmed.", createdDaysAgo: 40 },
  { id: "a-007", opportunityId: "o-eedp", clientId: "c-bluemesa", status: "Researching", amount: 1_500_000, writerId: "u-james", managerId: "u-david", risk: "High", nextAction: "Confirm SAM.gov renewal and tribal council resolution timeline", notes: "SAM.gov renewal due — blocking item for eligibility.", createdDaysAgo: 6 },
  { id: "a-008", opportunityId: "o-farm", clientId: "c-riverbend", status: "Eligibility Confirmed", amount: 150_000, writerId: "u-elena", managerId: "u-david", risk: "Medium", nextAction: "Confirm source of 50% matching funds", notes: "Working capital application for new cultured dairy line.", createdDaysAgo: 12 },
  { id: "a-009", opportunityId: "o-mfg", clientId: "c-meridian", status: "Submitted", amount: 1_200_000, writerId: "u-maria", managerId: "u-sarah", risk: "Low", nextAction: "Monitor agency status and prepare for clarification requests", notes: "Submitted two days before deadline. Grants.gov validation received.", createdDaysAgo: 75, submittedDaysAgo: 12, trackingNumber: "GRANT-DEMO-14082317" },
  { id: "a-010", opportunityId: "o-youth", clientId: "c-harborlight", status: "Awarded", amount: 500_000, writerId: "u-elena", managerId: "u-sarah", risk: "Low", nextAction: "Post-award kickoff and reporting calendar", notes: "Awarded in full.", createdDaysAgo: 240, submittedDaysAgo: 165, trackingNumber: "GRANT-DEMO-13377021", outcome: { decision: "Awarded", daysAgo: 40, amount: 500_000, notes: "Awarded in full. Period of performance begins next quarter." } },
  { id: "a-011", opportunityId: "o-econ", clientId: "c-pinecrest", status: "Awarded", amount: 750_000, writerId: "u-maria", managerId: "u-david", risk: "Low", nextAction: "Submit environmental review documentation", notes: "Board approved match.", createdDaysAgo: 280, submittedDaysAgo: 195, trackingNumber: "GRANT-DEMO-13190455", outcome: { decision: "Awarded", daysAgo: 62, amount: 750_000, notes: "Award for industrial site readiness." } },
  { id: "a-012", opportunityId: "o-apprentice", clientId: "c-ironworks", status: "Awarded", amount: 500_000, writerId: "u-elena", managerId: "u-david", risk: "Low", nextAction: "Quarterly performance report", notes: "", createdDaysAgo: 260, submittedDaysAgo: 175, trackingNumber: "GRANT-DEMO-13288160", outcome: { decision: "Awarded", daysAgo: 55, amount: 500_000, notes: "Awarded with minor budget revisions." } },
  { id: "a-013", opportunityId: "o-coastal", clientId: "c-coastal", status: "Not Awarded", amount: 350_000, writerId: "u-maria", managerId: "u-sarah", risk: "Medium", nextAction: "Request reviewer debrief", notes: "Reviewer feedback: strengthen monitoring plan and partner commitments.", createdDaysAgo: 220, submittedDaysAgo: 125, trackingNumber: "GRANT-DEMO-13450988", outcome: { decision: "Not Awarded", daysAgo: 30, amount: 0, notes: "Scored 78/100. Debrief requested." } },
  { id: "a-014", opportunityId: "o-cwag", clientId: "c-ironworks", status: "Writing", amount: 1_500_000, writerId: "u-elena", managerId: "u-david", risk: "Medium", nextAction: "Secure employer partner letters (6 of 10)", notes: "Expansion into clean energy trades with two union partners.", createdDaysAgo: 22 },
  { id: "a-015", opportunityId: "o-brownfield", clientId: "c-pinecrest", status: "Eligibility Confirmed", amount: 500_000, writerId: "u-james", managerId: "u-david", risk: "Medium", nextAction: "Board approval for application over $500K", notes: "Three candidate sites identified on former mill corridor.", createdDaysAgo: 10 },
];

const CLIENT_SHORT: Record<string, string> = {
  "c-horizon": "Horizon",
  "c-northstar": "NorthStar",
  "c-greenbridge": "GreenBridge",
  "c-cascade": "Cascade",
  "c-ironworks": "Ironworks",
  "c-meridian": "Meridian",
  "c-bluemesa": "BlueMesa",
  "c-harborlight": "Harborlight",
  "c-pinecrest": "Pinecrest",
  "c-atlas": "Atlas",
  "c-riverbend": "Riverbend",
  "c-coastal": "Coastal",
};

export function shortClientName(clientId: string, fallback: string) {
  return CLIENT_SHORT[clientId] ?? fallback.split(" ")[0];
}

export function buildApplications(clients: Client[], opps: Opportunity[]): Application[] {
  return APP_SEEDS.map((s) => {
    const client = clients.find((c) => c.id === s.clientId)!;
    const opportunity = opps.find((o) => o.id === s.opportunityId)!;
    const level = STAGE_LEVEL[s.status];
    const ctx = { client, opportunity, amount: s.amount };
    const isHero = s.id === "a-003";
    let sections = buildSections(ctx, level, s.writerId, Math.max(1, Math.round(s.createdDaysAgo / 6)));
    if (isHero) {
      sections = sections.map((sec, i) => ({ ...sec, ...HORIZON_SECTIONS[sec.key], updatedAt: isoFromNow(-(i % 4), 9 + i) }));
    }
    const compliance = isHero
      ? HORIZON_COMPLIANCE.map((c) => ({ ...c, id: uid("cr") }))
      : buildCompliance(opportunity, level, shortClientName(client.id, client.name));
    const narrative = isHero ? HORIZON_SECTIONS["budget-narrative"].content : level > 0.2 ? draftSectionContent("budget-narrative", ctx) : "";
    const budget = buildBudget(s.amount, opportunity.costSharePct, narrative, isHero);
    const internal = new Date(opportunity.deadline);
    internal.setDate(internal.getDate() - 5);
    const checklist = checklistFor(s.status);
    if (isHero) checklist.budgetCompleted = false;
    return {
      id: s.id,
      opportunityId: s.opportunityId,
      clientId: s.clientId,
      matchId: `m-${s.id}`,
      status: s.status,
      fundingRequested: s.amount,
      deadline: opportunity.deadline,
      internalDeadline: internal.toISOString(),
      writerId: s.writerId,
      managerId: s.managerId,
      risk: s.risk,
      nextAction: s.nextAction,
      notes: s.notes,
      checklist,
      sections,
      compliance,
      budget,
      submission: s.submittedDaysAgo
        ? { handoffOpenedAt: isoFromNow(-s.submittedDaysAgo, 10), submittedAt: isoFromNow(-s.submittedDaysAgo, 14, 32), trackingNumber: s.trackingNumber, submittedBy: s.managerId }
        : {},
      outcome: s.outcome
        ? { decision: s.outcome.decision, decidedAt: isoFromNow(-s.outcome.daysAgo, 11), amountAwarded: s.outcome.amount, notes: s.outcome.notes }
        : undefined,
      createdAt: isoFromNow(-s.createdDaysAgo, 9),
      updatedAt: isoFromNow(-(s.submittedDaysAgo ?? 1), 15),
    };
  });
}

// ---------------------------------------------------------------- Reviews

export function buildReviews(apps: Application[]): Review[] {
  const reviews: Review[] = [];
  for (const app of apps) {
    const level = STAGE_LEVEL[app.status];
    const due = (offset: number) => {
      const d = new Date(app.deadline);
      d.setDate(d.getDate() - offset);
      return d.toISOString();
    };
    const internalStatus = level >= 0.85 ? "Approved" : level >= 0.75 ? "Changes Requested" : level >= 0.5 ? "In Progress" : "Not Started";
    const clientStatus = level >= 1 ? "Approved" : level >= 0.85 ? "In Progress" : "Not Started";
    const complianceStatus = level >= 1 ? "Approved" : level >= 0.75 ? "In Progress" : "Not Started";
    reviews.push(
      {
        id: `r-${app.id}-int`,
        applicationId: app.id,
        type: "Internal Review",
        reviewers: ["Sarah Whitfield", "David Chen"],
        status: internalStatus,
        dueDate: due(10),
        comments: [],
        approvedAt: internalStatus === "Approved" ? isoFromNow(-6) : undefined,
      },
      {
        id: `r-${app.id}-cli`,
        applicationId: app.id,
        type: "Client Review",
        reviewers: ["Client team"],
        status: clientStatus,
        dueDate: due(6),
        comments: [],
        approvedAt: clientStatus === "Approved" ? isoFromNow(-3) : undefined,
      },
      {
        id: `r-${app.id}-cmp`,
        applicationId: app.id,
        type: "Compliance Review",
        reviewers: ["Priya Natarajan"],
        status: complianceStatus,
        dueDate: due(4),
        comments: [],
        approvedAt: complianceStatus === "Approved" ? isoFromNow(-2) : undefined,
      },
    );
  }

  const c = (id: string, authorId: string, authorName: string, body: string, daysAgo: number, sectionTitle?: string, resolved = false, replies: Review["comments"][number]["replies"] = []) => ({
    id,
    authorId,
    authorName,
    body,
    sectionTitle,
    createdAt: isoFromNow(-daysAgo, 11),
    resolved,
    replies,
  });

  const set = (rid: string, comments: Review["comments"]) => {
    const r = reviews.find((x) => x.id === rid);
    if (r) r.comments = comments;
  };

  set("r-a-003-int", [
    c("rc-1", "u-sarah", "Sarah Whitfield", "The measurable outcomes need baseline figures before final submission.", 1, "Goals & Objectives"),
    c("rc-2", "u-david", "David Chen", "Project Description still has a placeholder for partner fleets — please confirm the list with Cheyenne.", 1, "Project Description", false, [
      { id: "rr-1", authorId: "u-maria", authorName: "Maria Alvarez", body: "Requested on today's call. Expecting the list by Friday.", createdAt: isoFromNow(0, 9) },
    ]),
    c("rc-3", "u-sarah", "Sarah Whitfield", "Strong Statement of Need. Consider adding the downtime cost per vehicle to quantify impact.", 2, "Statement of Need", true),
  ]);
  set("r-a-002-int", [
    c("rc-4", "u-sarah", "Sarah Whitfield", "Evaluation plan should name the third-party evaluator and data collection schedule.", 2, "Evaluation Plan"),
    c("rc-5", "u-david", "David Chen", "Job creation estimates need a methodology footnote — reviewers will check this.", 2, "Project Description"),
    c("rc-6", "u-priya", "Priya Natarajan", "Confirm all 22 counties are under the 50,000 population threshold in the attachment.", 3, undefined, true),
  ]);
  set("r-a-002-cmp", [c("rc-7", "u-priya", "Priya Natarajan", "SF-424A totals do not match budget narrative by $1,250. Please reconcile.", 1, "Budget Narrative")]);
  set("r-a-006-cli", [
    c("rc-8", "client", "Gabriela Ortiz (Atlas)", "Please update the placement numbers — we placed 142 graduates last year, not 128.", 1, "Organizational Capacity"),
    c("rc-9", "u-elena", "Elena Rossi", "Final narrative sent for client sign-off.", 2, undefined, true),
  ]);
  set("r-a-001-int", [c("rc-10", "u-sarah", "Sarah Whitfield", "Approved. Excellent alignment to the evaluation criteria.", 8, undefined, true)]);
  set("r-a-005-int", [c("rc-11", "u-david", "David Chen", "Sustainability section must tie mobile unit costs to projected Medicaid reimbursement.", 1, "Sustainability")]);
  return reviews;
}
