// Predefined content used by the simulated AI service (lib/ai-service.ts) and the
// seed data. Swapping lib/ai-service.ts for real API calls leaves this unused.
import type { Client, NOFOAnalysis, Opportunity, ComplianceRequirement, ApplicationSection } from "./types";
import { formatCurrency, formatDate, isoFromNow, uid } from "./utils";

// ---------------------------------------------------------------- Sections

export interface SectionDef {
  key: string;
  title: string;
  wordLimit: number;
  requirement: string;
  guidance: string;
  evidence: string[];
}

export const SECTION_DEFS: SectionDef[] = [
  {
    key: "executive-summary",
    title: "Executive Summary",
    wordLimit: 500,
    requirement: "Provide a one-page abstract summarizing the applicant, project purpose, target population, major activities, and expected outcomes.",
    guidance: "Lead with the problem and the result. Name the funding request, period of performance, and two or three quantified outcomes. Avoid jargon; reviewers often read this first and last.",
    evidence: ["Capability Statement", "Project Logic Model"],
  },
  {
    key: "statement-of-need",
    title: "Statement of Need",
    wordLimit: 1200,
    requirement: "Describe the demonstrated need for the proposed initiative and provide supporting evidence.",
    guidance: "Use local data first, then state and national comparisons. Cite sources and dates. Connect each need directly to an activity in the Project Description.",
    evidence: ["2025 Community Needs Assessment", "Service Area Statistics", "Previous Program Outcomes"],
  },
  {
    key: "project-description",
    title: "Project Description",
    wordLimit: 2500,
    requirement: "Describe the proposed project, including activities, target population, partners, and how the project addresses program priorities.",
    guidance: "Map activities to each program priority listed in the NOFO. Use sub-headings that mirror the evaluation criteria so reviewers can score easily.",
    evidence: ["Partner Letters of Commitment", "Site Plans", "Equipment Quotes"],
  },
  {
    key: "goals-objectives",
    title: "Goals & Objectives",
    wordLimit: 800,
    requirement: "Provide SMART goals and objectives with baseline measures and annual targets.",
    guidance: "Every objective needs a baseline, a target, and a data source. Keep to 3–5 objectives tied to the logic model.",
    evidence: ["Baseline Performance Data", "Project Logic Model"],
  },
  {
    key: "implementation-plan",
    title: "Implementation Plan",
    wordLimit: 1500,
    requirement: "Provide a timeline with milestones, responsible parties, and key deliverables for the period of performance.",
    guidance: "Use quarters, not months, for multi-year projects. Show realistic procurement and hiring lead times.",
    evidence: ["Project Timeline (Gantt)", "Staffing Plan"],
  },
  {
    key: "evaluation-plan",
    title: "Evaluation Plan",
    wordLimit: 1000,
    requirement: "Describe how performance will be measured, data collected, and results reported to the agency.",
    guidance: "Name the evaluator, data systems, reporting frequency, and how findings will drive continuous improvement.",
    evidence: ["Evaluation Consultant Scope", "Data Collection Instruments"],
  },
  {
    key: "organizational-capacity",
    title: "Organizational Capacity",
    wordLimit: 1000,
    requirement: "Demonstrate the applicant's experience, key personnel, and financial management capacity to administer federal funds.",
    guidance: "Highlight comparable projects, key staff qualifications, and financial controls. Reference resumes and the organizational chart.",
    evidence: ["Organization Chart", "Key Personnel Resumes", "Past Performance Summary"],
  },
  {
    key: "sustainability",
    title: "Sustainability",
    wordLimit: 600,
    requirement: "Explain how project activities and outcomes will be sustained after the federal period of performance ends.",
    guidance: "Identify specific revenue streams, partner commitments, and policy changes that continue the work.",
    evidence: ["Multi-year Financial Projection", "Partner Commitments"],
  },
  {
    key: "budget-narrative",
    title: "Budget Narrative",
    wordLimit: 1500,
    requirement: "Provide a detailed justification for each budget category, including the basis for cost estimates and cost-share sources.",
    guidance: "Mirror the SF-424A categories exactly. Explain calculations (quantity × rate) and identify the source of matching funds.",
    evidence: ["Budget Workbook", "Equipment Quotes", "Indirect Cost Policy"],
  },
];

interface DraftContext {
  client: Client;
  opportunity: Opportunity;
  amount: number;
}

function list(items: string[], n = 3): string {
  const xs = items.slice(0, n).map((s) => s.toLowerCase());
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
}

/** Predefined, context-aware draft content for a section. */
export function draftSectionContent(key: string, ctx: DraftContext): string {
  const { client, opportunity: opp, amount } = ctx;
  const area = client.serviceAreas.slice(0, 3).join(", ");
  const focus = list(client.fundingProfile.objectives, 3);
  switch (key) {
    case "executive-summary":
      return `${client.name} requests ${formatCurrency(amount)} from the ${opp.agency} under the ${opp.title} to advance ${focus} across ${client.serviceArea}.

Founded in ${client.yearFounded}, ${client.name} is a ${client.organizationType.toLowerCase()} with ${client.employees} employees. ${client.summary}

Over a ${opp.periodOfPerformance} period of performance, the project will deliver measurable improvements in service capacity, workforce readiness, and community outcomes. Planned results include expanded service coverage in ${area}, credentialed training for local workers, and documented reductions in operating costs that will be tracked and reported quarterly.`;
    case "statement-of-need":
      return `${client.serviceArea} faces a widening gap between demand for services and the local capacity to deliver them. Recent regional data show sustained growth in demand while the qualified workforce has not kept pace, and existing infrastructure is aging faster than it can be replaced.

According to the 2025 Community Needs Assessment, stakeholders in ${area} identified ${list(client.fundingInterests, 3)} as top priorities. Service area statistics indicate that residents and businesses in these communities experience longer wait times, higher costs, and fewer local training pathways than state averages.

${client.name}'s own program data confirm this need: over the past two years, the organization has turned away qualified requests because of capacity constraints. Without investment, these gaps will continue to limit economic mobility and delay the outcomes that the ${opp.title} is designed to achieve.`;
    case "project-description":
      return `The proposed project will expand ${client.name}'s capacity through three integrated components aligned to the program priorities in the ${opp.title}.

Component 1 — Infrastructure & Equipment. Procure and deploy equipment that modernizes core operations and directly supports ${opp.keywords.slice(0, 2).join(" and ")}.

Component 2 — Workforce Development. Launch a structured training pathway that prepares local workers for in-demand roles, delivered with education and employer partners.

Component 3 — Community & Partner Engagement. Formalize partnerships with public agencies and community organizations in ${area} to extend reach and ensure the project serves priority populations.

Each component includes defined milestones, responsible staff, and performance measures that are detailed in the Implementation and Evaluation Plans.`;
    case "goals-objectives":
      return `Goal 1: Expand service capacity across ${client.serviceArea}.
• Objective 1.1: Increase annual service volume by 30% over baseline by the end of Year 2.
• Objective 1.2: Bring new equipment into full operation within 9 months of award.

Goal 2: Build a skilled local workforce.
• Objective 2.1: Enroll 40 participants in training, with 80% completing an industry-recognized credential.
• Objective 2.2: Place 75% of completers into employment within 90 days.

Goal 3: Demonstrate measurable community and operational outcomes.
• Objective 3.1: Reduce per-unit operating costs by 15% compared to the baseline year.
• Objective 3.2: Publish an annual outcomes report for the agency and community partners.`;
    case "implementation-plan":
      return `Quarter 1: Execute award agreement, finalize staffing, issue procurement for equipment, and convene the partner advisory group.
Quarter 2: Complete equipment installation, launch participant recruitment, and finalize the data collection plan with the evaluator.
Quarters 3–6: Deliver training cohorts, operate expanded services, and report quarterly performance to the program officer.
Quarters 7–10: Scale to full capacity, conduct mid-point evaluation, and implement improvements.
Final Quarter: Complete the summative evaluation, finalize the sustainability plan, and submit closeout reports.

The Project Director will oversee the timeline, supported by the operations lead and finance staff responsible for federal financial reporting.`;
    case "evaluation-plan":
      return `${client.name} will engage an independent evaluator to conduct process and outcome evaluation. Data will be collected through program records, participant surveys, and operational systems, and reviewed monthly by the project team.

Key performance measures include participants enrolled and credentialed, service volume, operating cost per unit, and partner engagement. Results will be reported quarterly to the ${opp.agency} and used in continuous improvement meetings with partners.`;
    case "organizational-capacity":
      return `${client.name} has operated in ${client.city}, ${client.state} since ${client.yearFounded} and brings demonstrated experience in ${list(client.capabilities, 3)}.

The organization maintains documented financial management policies, segregation of duties, and an accounting system capable of tracking federal funds by award and cost category. ${client.fundingProfile.pastAwards.length ? `Relevant prior awards include ${client.fundingProfile.pastAwards.map((a) => `${a.title} (${a.agency}, ${a.year})`).join("; ")}.` : "The organization will supplement its internal capacity with experienced grants management support."}`;
    case "sustainability":
      return `${client.name} will sustain project outcomes through earned revenue from expanded services, continued partner commitments, and integration of the training pathway into ongoing operations. Equipment purchased under the award will remain in service beyond the period of performance, and partner agreements are structured as multi-year commitments.`;
    case "budget-narrative":
      return `The total project budget supports personnel, fringe benefits, equipment, supplies, contractual services, and limited travel necessary to achieve project objectives. All costs are allocable, reasonable, and consistent with 2 CFR 200.

Personnel: Salaries are based on current pay scales for the Project Director, program staff, and data support, prorated by level of effort.
Fringe: Calculated at the organization's standard fringe rate.
Equipment: Based on vendor quotes for items with a unit cost above $5,000.
Contractual: Includes installation services and an independent evaluator procured under the organization's procurement policy.
Cost Share: ${client.name} will contribute matching funds from operating reserves and in-kind staff time, documented in the Budget Workbook.`;
    default:
      return `${client.name} will address this section in alignment with the ${opp.title} requirements.`;
  }
}

/** Simulated "Improve" — tightens language and adds evidence-oriented phrasing. */
export function improveContent(text: string, sectionTitle: string): string {
  const base = text.trim();
  if (!base) return base;
  const additions: Record<string, string> = {
    "Statement of Need":
      "\n\nThese conditions are documented in the attached needs assessment and service area statistics, and they align directly with the program's stated priority populations.",
    "Goals & Objectives":
      "\n\nAll objectives include a baseline value, an annual target, and a named data source, and they are mapped to the project logic model.",
  };
  const improved = base
    .replace(/\bwill try to\b/gi, "will")
    .replace(/\bvery\b /gi, "")
    .replace(/\ba lot of\b/gi, "significant")
    .replace(/\bhelp\b/gi, "enable")
    .replace(/\bthings\b/gi, "activities");
  return improved + (additions[sectionTitle] ?? "\n\nThis approach directly supports the evaluation criteria and positions the project to deliver measurable, reportable outcomes.");
}

/** Simulated "Shorten" — keeps the strongest ~65% of sentences per paragraph. */
export function shortenContent(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => {
      const sentences = para.match(/[^.!?]+[.!?]+(\s|$)/g);
      if (!sentences || sentences.length <= 2) return para.trim();
      const keep = Math.max(2, Math.ceil(sentences.length * 0.65));
      return sentences.slice(0, keep).join("").trim();
    })
    .join("\n\n");
}

export interface RequirementCheck {
  score: number;
  met: string[];
  gaps: string[];
}

/** Simulated "Check Requirement" — heuristic checks against the section requirement. */
export function checkRequirement(section: Pick<ApplicationSection, "title" | "content" | "wordLimit">): RequirementCheck {
  const text = section.content;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const met: string[] = [];
  const gaps: string[] = [];
  if (words === 0) return { score: 0, met, gaps: ["Section has no content yet."] };
  if (words <= section.wordLimit) met.push(`Within word limit (${words} / ${section.wordLimit}).`);
  else gaps.push(`Exceeds word limit by ${words - section.wordLimit} words.`);
  if (/\d/.test(text)) met.push("Includes quantified data or targets.");
  else gaps.push("Add quantified data (baselines, targets, or statistics).");
  if (/assessment|statistic|data|source|according/i.test(text)) met.push("References supporting evidence.");
  else gaps.push("Reference a specific evidence source (e.g., needs assessment, program data).");
  if (/partner/i.test(text)) met.push("Identifies partners or stakeholders.");
  else gaps.push("Consider naming partners or stakeholders involved.");
  if (section.title === "Goals & Objectives" && !/baseline/i.test(text)) gaps.push("Objectives should include explicit baseline figures.");
  if (words < 120) gaps.push("Section appears underdeveloped relative to reviewer expectations.");
  const score = Math.round((met.length / Math.max(1, met.length + gaps.length)) * 100);
  return { score, met, gaps };
}

// ---------------------------------------------------------------- NOFO analysis

const CATEGORY_PRIORITIES: Record<string, string[]> = {
  Transportation: ["Emissions reduction from fleet operations", "Workforce capacity for clean vehicle technologies", "Benefits to disadvantaged communities", "Measurable safety and reliability improvements"],
  Energy: ["Measurable energy savings", "Deployment-ready projects", "Community benefits and workforce plans", "Replicability of the model"],
  "Workforce Development": ["Employer-driven training design", "Industry-recognized credentials", "Placement and wage outcomes", "Serving underrepresented populations"],
  Health: ["Access for underserved rural populations", "Integration of behavioral health", "Sustainability through reimbursement", "Data-driven quality improvement"],
  "Rural Development": ["Job creation in rural areas", "Technology adoption by rural businesses", "Leveraged private investment", "Regional economic resilience"],
};

const CATEGORY_ATTACHMENTS: Record<string, string[]> = {
  Transportation: ["Letters of Support (minimum 3)", "Equipment Quotes", "Site Control Documentation", "Emissions Reduction Estimate"],
  Energy: ["Letters of Commitment", "Energy Savings Methodology", "Community Benefits Plan", "Equipment Specifications"],
  "Workforce Development": ["Employer Partner Letters", "Training Curriculum Outline", "Credential Alignment Table"],
  Health: ["Service Area Map", "Letters of Support", "Staffing Plan", "Sliding Fee Schedule"],
};

export function buildNofoAnalysis(opp: Opportunity, analyzedBy = "u-james"): NOFOAnalysis {
  const priorities = CATEGORY_PRIORITIES[opp.category] ?? [
    "Alignment with agency strategic goals",
    "Measurable outcomes and performance reporting",
    "Organizational capacity to manage federal funds",
    "Community and partner engagement",
  ];
  const attachments = [
    "SF-424 Application for Federal Assistance",
    "SF-424A Budget Information",
    "Project Narrative",
    "Budget Narrative / Justification",
    "Project Abstract",
    ...(CATEGORY_ATTACHMENTS[opp.category] ?? ["Letters of Support", "Logic Model"]),
    "Key Personnel Resumes",
    "Organizational Chart",
    "SF-LLL Disclosure of Lobbying Activities",
  ];
  const deadline = new Date(opp.deadline);
  const minus = (days: number) => {
    const d = new Date(deadline);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };
  const isCtip = opp.id === "o-ctip";
  return {
    opportunityId: opp.id,
    analyzedAt: new Date().toISOString(),
    analyzedBy,
    summary: isCtip
      ? "This program supports small businesses implementing transportation infrastructure improvements that reduce operational emissions and improve workforce capacity. Strong applications pair deployment-ready infrastructure with a documented technician training pathway and clear emissions-reduction estimates."
      : `${opp.summary} Competitive applications will demonstrate clear alignment to program priorities, measurable outcomes with baselines, and the organizational capacity to manage a federal award.`,
    programPurpose: opp.summary,
    eligibleApplicants: opp.eligibility.map((e) =>
      e === "Small Business" ? "Small businesses meeting SBA size standards for their primary NAICS" : e === "Nonprofit" ? "Nonprofit organizations with 501(c)(3) status" : e,
    ),
    fundingRange: `${formatCurrency(opp.awardFloor)} – ${formatCurrency(opp.awardCeiling)} per award (approx. ${opp.expectedAwards} awards)`,
    periodOfPerformance: opp.periodOfPerformance,
    applicationDeadline: opp.deadline,
    costSharing: opp.costSharePct > 0 ? `Required: ${opp.costSharePct}% non-federal cost share of total project cost (cash or in-kind)` : "Not required",
    keyPriorities: priorities,
    keyRequirements: isCtip
      ? [
          "Applicant must meet defined small-business eligibility.",
          "Proposed project must operate within eligible geographic areas.",
          "Budget narrative is required.",
          "Project must demonstrate measurable outcomes.",
          "Cost-share requirement: 20%.",
        ]
      : [
          `Applicant must be one of: ${opp.eligibility.join(", ")}.`,
          "Active SAM.gov registration required at time of submission.",
          "Project narrative must address each evaluation criterion.",
          "Budget narrative and SF-424A are required.",
          opp.costSharePct > 0 ? `Cost-share requirement: ${opp.costSharePct}%.` : "No cost share required; leveraged resources strengthen the application.",
        ],
    requiredAttachments: attachments,
    submissionRequirements: [
      "Submit electronically through Grants.gov Workspace by 11:59 p.m. ET on the deadline.",
      "Project narrative limited to 20 double-spaced pages, 12-point font, 1-inch margins.",
      "All attachments in PDF format with descriptive file names.",
      "Authorized Organization Representative (AOR) must submit the application.",
      "Allow 2–5 business days for Grants.gov validation and agency receipt.",
    ],
    evaluationCriteria: [
      { criterion: "Project Design & Approach", points: 30, description: "Quality and feasibility of the approach and alignment to program priorities." },
      { criterion: "Statement of Need", points: 20, description: "Evidence of need in the proposed service area with credible data." },
      { criterion: "Outcomes & Evaluation", points: 20, description: "SMART objectives, baselines, and a credible evaluation plan." },
      { criterion: "Organizational Capacity", points: 15, description: "Experience, key personnel, and financial management systems." },
      { criterion: "Budget & Cost Effectiveness", points: 15, description: "Reasonable, allowable costs clearly linked to activities." },
    ],
    importantDates: [
      { label: "NOFO posted", date: opp.postedDate },
      { label: "Informational webinar", date: minus(Math.max(1, Math.round((deadline.getTime() - new Date(opp.postedDate).getTime()) / 86400000 / 2))) },
      { label: "Questions due to agency", date: minus(10) },
      { label: "Recommended internal draft complete", date: minus(7) },
      { label: "Application deadline", date: opp.deadline },
      { label: "Anticipated award date", date: isoFromNow(Math.round((deadline.getTime() - Date.now()) / 86400000) + 120) },
    ],
    risks: [
      opp.costSharePct > 0 ? `${opp.costSharePct}% cost share must be documented with commitment letters.` : "Competitive pool expected to be large; differentiation is critical.",
      "Letters of support should be requested at least 3 weeks before the deadline.",
      `Deadline ${formatDate(opp.deadline)} — confirm SAM.gov and Grants.gov registrations are current.`,
    ],
  };
}

/** Compliance matrix derived from a NOFO analysis. */
export function buildComplianceFromNofo(
  analysis: NOFOAnalysis,
  statusFor: (index: number) => ComplianceRequirement["status"] = () => "Missing",
  owners: string[] = ["u-maria", "u-david", "u-priya", "client"],
): ComplianceRequirement[] {
  const sectionFor = (req: string) => {
    if (/Narrative$|Project Narrative/i.test(req)) return "Project Description";
    if (/Budget/i.test(req)) return "Budget";
    if (/Abstract/i.test(req)) return "Executive Summary";
    if (/SF-/i.test(req)) return "Federal Forms";
    return "Documents";
  };
  const extra = [
    { req: "Statement of Need", source: "Section IV.B.1", section: "Statement of Need" },
    { req: "Goals, Objectives & Performance Measures", source: "Section IV.B.2", section: "Goals & Objectives" },
    { req: "Evaluation Plan", source: "Section IV.B.4", section: "Evaluation Plan" },
    { req: "Sustainability Plan", source: "Section IV.B.6", section: "Sustainability" },
  ];
  const rows = [
    ...analysis.requiredAttachments.map((r, i) => ({ req: r, source: r.startsWith("SF-") ? "Section IV.A" : `Attachment ${i + 1}`, section: sectionFor(r) })),
    ...extra,
  ];
  return rows.map((r, i) => ({
    id: uid("cr"),
    requirement: r.req,
    source: r.source,
    assignedSection: r.section,
    evidence: "—",
    ownerId: owners[i % owners.length],
    status: statusFor(i),
  }));
}
