// Data service layer. All reads/writes from UI code go through these functions,
// so the localStorage implementation can later be swapped for API calls.
import type {
  Activity,
  AppData,
  AppNotification,
  Application,
  ApplicationStatus,
  BudgetCategory,
  BudgetItem,
  ChecklistKey,
  Client,
  ComplianceRequirement,
  Contact,
  DocumentItem,
  DocumentRequest,
  GoNoGoAssessment,
  GrantMatch,
  Lead,
  LeadStage,
  NOFOAnalysis,
  OutcomeRecord,
  ApplicationSection,
  ApplicationBudget,
  Review,
  ReviewStatus,
  Settings,
  Task,
} from "./types";
import { getState, resetState, update } from "./store";
import { aiService } from "./ai-service";
import { buildComplianceFromNofo, buildNofoAnalysis } from "./content-library";
import { computeMatch, emptyGoNoGo, goNoGoTotal } from "./matching";
import { budgetTotals, riskFromMatch } from "./selectors";
import { buildBudget, buildSections, checklistFor } from "./mock/applications";
import { formatCurrency, isoFromNow, uid } from "./utils";

export { useAppData, useHydrated, getState } from "./store";

const now = () => new Date().toISOString();
const me = () => getState().settings.currentUserId;

function log(d: AppData, a: Omit<Activity, "id" | "createdAt" | "actorId"> & { actorId?: Activity["actorId"] }) {
  d.activities.unshift({ id: uid("act"), createdAt: now(), actorId: a.actorId ?? d.settings.currentUserId, ...a });
}

function notify(d: AppData, n: Omit<AppNotification, "id" | "createdAt" | "read">) {
  d.notifications.unshift({ id: uid("nt"), createdAt: now(), read: false, ...n });
}

function touchClient(d: AppData, clientId?: string) {
  const c = d.clients.find((x) => x.id === clientId);
  if (c) c.lastActivity = now();
}

function findApp(d: AppData, id: string): Application {
  const a = d.applications.find((x) => x.id === id);
  if (!a) throw new Error(`Application ${id} not found`);
  return a;
}

function touchApp(d: AppData, app: Application) {
  app.updatedAt = now();
  touchClient(d, app.clientId);
}

// ---------------------------------------------------------------- Leads

export type LeadInput = Omit<Lead, "id" | "notes" | "tasks" | "createdAt" | "lastContact"> & { lastContact?: string };

export function addLead(input: LeadInput): string {
  const id = uid("l");
  update((d) => {
    d.leads.unshift({ ...input, id, lastContact: input.lastContact ?? now(), notes: [], tasks: [], createdAt: now() });
    log(d, { type: "lead", message: `New lead added: ${input.company}.`, leadId: id });
  });
  return id;
}

export function updateLead(id: string, patch: Partial<Lead>) {
  update((d) => {
    const l = d.leads.find((x) => x.id === id);
    if (l) Object.assign(l, patch);
  });
}

export function moveLeadStage(id: string, stage: LeadStage) {
  update((d) => {
    const l = d.leads.find((x) => x.id === id);
    if (!l || l.stage === stage) return;
    l.stage = stage;
    l.lastContact = now();
    if (stage === "Proposal Sent" && l.proposalStatus === "Not Started") l.proposalStatus = "Sent";
    if (stage === "Won") l.proposalStatus = "Accepted";
    log(d, { type: "lead", message: `${l.company} moved to ${stage}.`, leadId: id });
  });
}

export function deleteLead(id: string) {
  update((d) => {
    d.leads = d.leads.filter((x) => x.id !== id);
  });
}

export function addLeadNote(id: string, body: string) {
  update((d) => {
    const l = d.leads.find((x) => x.id === id);
    if (!l) return;
    l.notes.unshift({ id: uid("n"), authorId: d.settings.currentUserId, body, createdAt: now() });
    l.lastContact = now();
  });
}

export function addLeadTask(id: string, title: string, dueDate: string) {
  update((d) => {
    const l = d.leads.find((x) => x.id === id);
    l?.tasks.push({ id: uid("lt"), title, dueDate, done: false });
  });
}

export function toggleLeadTask(leadId: string, taskId: string) {
  update((d) => {
    const t = d.leads.find((x) => x.id === leadId)?.tasks.find((x) => x.id === taskId);
    if (t) t.done = !t.done;
  });
}

/** Converts a won lead into a client record. Returns the new client id. */
export function convertLeadToClient(leadId: string): string | undefined {
  const lead = getState().leads.find((l) => l.id === leadId);
  if (!lead) return;
  const [city, state] = lead.location.split(",").map((s) => s.trim());
  const clientId = addClient({
    name: lead.company,
    organizationType: lead.organizationType,
    industry: lead.grantCategories[0] ?? "General",
    city: city ?? "",
    state: state ?? "",
    naics: [],
    serviceArea: lead.location,
    fundingInterests: lead.grantCategories,
    certifications: [],
    status: "Onboarding",
    potentialFunding: lead.estimatedValue,
    summary: lead.fundingNeed,
    contactName: lead.contactName,
    contactTitle: lead.contactTitle,
    contactEmail: lead.email,
    contactPhone: lead.phone,
  });
  update((d) => {
    const l = d.leads.find((x) => x.id === leadId);
    if (l) l.stage = "Won";
  });
  return clientId;
}

// ---------------------------------------------------------------- Clients

export interface ClientInput {
  name: string;
  organizationType: Client["organizationType"];
  industry: string;
  city: string;
  state: string;
  naics: string[];
  serviceArea: string;
  fundingInterests: string[];
  certifications: string[];
  status: Client["status"];
  potentialFunding: number;
  summary: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
}

export function addClient(input: ClientInput): string {
  const id = uid("c");
  update((d) => {
    d.clients.unshift({
      id,
      name: input.name,
      organizationType: input.organizationType,
      industry: input.industry,
      city: input.city,
      state: input.state,
      naics: input.naics,
      serviceArea: input.serviceArea,
      fundingInterests: input.fundingInterests,
      certifications: input.certifications,
      status: input.status,
      potentialFunding: input.potentialFunding,
      lastActivity: now(),
      summary: input.summary,
      capabilities: [],
      serviceAreas: input.serviceArea ? [input.serviceArea] : [],
      employees: 0,
      annualRevenue: "—",
      yearFounded: new Date().getFullYear(),
      website: "",
      samRegistration: "In Progress",
      accountManagerId: d.settings.currentUserId,
      fundingProfile: {
        objectives: input.fundingInterests,
        targetAmount: input.potentialFunding,
        preferredAgencies: [],
        eligibleOrgTypes: [input.organizationType],
        geography: input.state ? [input.state] : [],
        keywords: input.fundingInterests,
        pastAwards: [],
        constraints: [],
        matchCapacityPct: 10,
      },
      createdAt: now(),
    });
    if (input.contactName) {
      d.contacts.push({
        id: uid("ct"),
        clientId: id,
        name: input.contactName,
        title: input.contactTitle,
        email: input.contactEmail,
        phone: input.contactPhone,
        isPrimary: true,
        role: "Primary Contact",
      });
    }
    log(d, { type: "client", message: `New client added: ${input.name}.`, clientId: id });
  });
  return id;
}

export function updateClient(id: string, patch: Partial<Client>) {
  update((d) => {
    const c = d.clients.find((x) => x.id === id);
    if (!c) return;
    Object.assign(c, patch);
    c.lastActivity = now();
    log(d, { type: "client", message: `Client profile updated for ${c.name}.`, clientId: id });
  });
}

export function updateFundingProfile(id: string, patch: Partial<Client["fundingProfile"]>) {
  update((d) => {
    const c = d.clients.find((x) => x.id === id);
    if (!c) return;
    c.fundingProfile = { ...c.fundingProfile, ...patch };
    c.lastActivity = now();
    log(d, { type: "client", message: `Funding profile updated for ${c.name}.`, clientId: id });
  });
}

export function addContact(input: Omit<Contact, "id">) {
  update((d) => {
    if (input.isPrimary) d.contacts.forEach((c) => c.clientId === input.clientId && (c.isPrimary = false));
    d.contacts.push({ ...input, id: uid("ct") });
  });
}

export function primaryContact(d: AppData, clientId: string): Contact | undefined {
  return d.contacts.find((c) => c.clientId === clientId && c.isPrimary) ?? d.contacts.find((c) => c.clientId === clientId);
}

// ---------------------------------------------------------------- Opportunities & NOFO

export function toggleSaveOpportunity(id: string) {
  update((d) => {
    const o = d.opportunities.find((x) => x.id === id);
    if (o) o.saved = !o.saved;
  });
}

export async function runNofoAnalysis(opportunityId: string): Promise<NOFOAnalysis | undefined> {
  const opp = getState().opportunities.find((o) => o.id === opportunityId);
  if (!opp) return;
  const analysis = await aiService.analyzeNofo(opp, me());
  update((d) => {
    d.nofoAnalyses[opportunityId] = analysis;
    d.applications.filter((a) => a.opportunityId === opportunityId).forEach((a) => (a.checklist.nofoAnalyzed = true));
    log(d, { type: "analysis", message: `NOFO analysis completed for ${opp.title}.`, opportunityId });
  });
  return analysis;
}

// ---------------------------------------------------------------- Matching / Go-No-Go

/** Calculate (or recalculate) a match for a client/opportunity pair. */
export function calculateMatch(clientId: string, opportunityId: string): GrantMatch | undefined {
  const s = getState();
  const client = s.clients.find((c) => c.id === clientId);
  const opp = s.opportunities.find((o) => o.id === opportunityId);
  if (!client || !opp) return;
  const computed = computeMatch(client, opp);
  let result: GrantMatch | undefined;
  update((d) => {
    const existing = d.matches.find((m) => m.clientId === clientId && m.opportunityId === opportunityId);
    if (existing) {
      Object.assign(existing, computed, { status: existing.status === "Dismissed" ? "New" : existing.status });
      result = existing;
    } else {
      result = { ...computed, id: uid("m"), status: "New", createdAt: now() };
      d.matches.unshift(result);
      log(d, { type: "match", message: `${opp.title} matched to ${client.name} (${computed.score}%).`, clientId, opportunityId, actorId: "system" });
    }
  });
  return result;
}

/** Score every active client against an opportunity; returns new/updated matches scoring 40+. */
export function matchClientsToOpportunity(opportunityId: string): GrantMatch[] {
  const s = getState();
  const opp = s.opportunities.find((o) => o.id === opportunityId);
  if (!opp) return [];
  const out: GrantMatch[] = [];
  update((d) => {
    for (const client of d.clients.filter((c) => c.status !== "Inactive")) {
      const computed = computeMatch(client, opp);
      if (computed.score < 40) continue;
      const existing = d.matches.find((m) => m.clientId === client.id && m.opportunityId === opportunityId);
      if (existing) {
        if (existing.status === "Application Started") {
          out.push(existing);
          continue;
        }
        Object.assign(existing, computed);
        out.push(existing);
      } else {
        const m: GrantMatch = { ...computed, id: uid("m"), status: "New", createdAt: now() };
        d.matches.unshift(m);
        out.push(m);
      }
    }
    if (out.length) log(d, { type: "match", message: `${opp.title} matched to ${out.length} client${out.length === 1 ? "" : "s"}.`, opportunityId, actorId: "system" });
  });
  return out;
}

export function dismissMatch(id: string) {
  update((d) => {
    const m = d.matches.find((x) => x.id === id);
    if (m) m.status = "Dismissed";
  });
}

export function restoreMatch(id: string) {
  update((d) => {
    const m = d.matches.find((x) => x.id === id);
    if (m) m.status = "New";
  });
}

export function setMatchStatus(id: string, status: GrantMatch["status"]) {
  update((d) => {
    const m = d.matches.find((x) => x.id === id);
    if (m) m.status = status;
  });
}

export function updateGoNoGo(matchId: string, patch: Partial<Omit<GoNoGoAssessment, "scores">> & { scores?: Partial<GoNoGoAssessment["scores"]> }) {
  update((d) => {
    const m = d.matches.find((x) => x.id === matchId);
    if (!m) return;
    const current = m.goNoGo ?? emptyGoNoGo();
    m.goNoGo = { ...current, ...patch, scores: { ...current.scores, ...(patch.scores ?? {}) }, updatedAt: now() };
    if (m.status === "New") m.status = "Reviewing";
  });
}

/** Approves pursuit for a match and creates the application workspace. Returns the application id. */
export function approvePursuit(matchId: string): string | undefined {
  const s = getState();
  const match = s.matches.find((m) => m.id === matchId);
  if (!match) return;
  if (match.applicationId) return match.applicationId;
  const client = s.clients.find((c) => c.id === match.clientId)!;
  const opp = s.opportunities.find((o) => o.id === match.opportunityId)!;
  const appId = uid("a");
  const amount = Math.min(opp.awardCeiling, Math.max(opp.awardFloor, Math.round(client.fundingProfile.targetAmount / 2 / 25_000) * 25_000));
  update((d) => {
    const m = d.matches.find((x) => x.id === matchId)!;
    const userId = d.settings.currentUserId;
    m.goNoGo = { ...(m.goNoGo ?? emptyGoNoGo()), approved: true, approvedAt: now(), approvedBy: userId, updatedAt: now() };
    m.status = "Application Started";
    m.applicationId = appId;
    const analysis = d.nofoAnalyses[opp.id] ?? buildNofoAnalysis(opp);
    const checklist = checklistFor("Eligibility Confirmed");
    checklist.nofoAnalyzed = !!d.nofoAnalyses[opp.id];
    const internal = new Date(opp.deadline);
    internal.setDate(internal.getDate() - 5);
    const app: Application = {
      id: appId,
      opportunityId: opp.id,
      clientId: client.id,
      matchId,
      status: "Eligibility Confirmed",
      fundingRequested: amount,
      deadline: opp.deadline,
      internalDeadline: internal.toISOString(),
      writerId: "u-maria",
      managerId: "u-david",
      risk: riskFromMatch(m),
      nextAction: "Kick off narrative and request client documents",
      notes: m.goNoGo.notes,
      checklist,
      sections: buildSections({ client, opportunity: opp, amount }, 0.1, "u-maria"),
      compliance: buildComplianceFromNofo(analysis),
      budget: buildBudget(amount, opp.costSharePct, ""),
      submission: {},
      createdAt: now(),
      updatedAt: now(),
    };
    d.applications.unshift(app);
    const reviewDue = (days: number) => {
      const x = new Date(opp.deadline);
      x.setDate(x.getDate() - days);
      return x.toISOString();
    };
    d.reviews.push(
      { id: uid("r"), applicationId: appId, type: "Internal Review", reviewers: ["Sarah Whitfield", "David Chen"], status: "Not Started", dueDate: reviewDue(10), comments: [] },
      { id: uid("r"), applicationId: appId, type: "Client Review", reviewers: ["Client team"], status: "Not Started", dueDate: reviewDue(6), comments: [] },
      { id: uid("r"), applicationId: appId, type: "Compliance Review", reviewers: ["Priya Natarajan"], status: "Not Started", dueDate: reviewDue(4), comments: [] },
    );
    const taskBase = { applicationId: appId, clientId: client.id, createdAt: now(), status: "To Do" as const };
    d.tasks.unshift(
      { ...taskBase, id: uid("t"), title: "Draft Statement of Need", ownerId: "u-maria", dueDate: isoFromNow(4, 17), priority: "High", type: "Writing" },
      { ...taskBase, id: uid("t"), title: "Request required client documents", ownerId: "u-david", dueDate: isoFromNow(1, 17), priority: "High", type: "Documents" },
      { ...taskBase, id: uid("t"), title: "Build project budget", ownerId: "u-david", dueDate: isoFromNow(7, 17), priority: "Medium", type: "Writing" },
    );
    const total = goNoGoTotal(m.goNoGo);
    log(d, { type: "eligibility", message: `Go/No-Go approved (${total}/10): ${opp.title} for ${client.name}.`, clientId: client.id, opportunityId: opp.id, applicationId: appId });
    log(d, { type: "status", message: `Application workspace created: ${opp.title}.`, clientId: client.id, opportunityId: opp.id, applicationId: appId });
    notify(d, { type: "task", title: "Application workspace created", body: `${opp.title} — ${client.name}. 3 starter tasks assigned.`, href: `/applications/${appId}` });
    touchClient(d, client.id);
  });
  return appId;
}

// ---------------------------------------------------------------- Applications

export function updateApplication(id: string, patch: Partial<Application>) {
  update((d) => {
    const a = findApp(d, id);
    Object.assign(a, patch);
    touchApp(d, a);
  });
}

export function setApplicationStatus(id: string, status: ApplicationStatus) {
  update((d) => {
    const a = findApp(d, id);
    if (a.status === status) return;
    const prev = a.status;
    a.status = status;
    if (status === "Ready to Submit") a.checklist.readyToSubmit = true;
    if (status === "Writing") a.checklist.narrativeStarted = true;
    touchApp(d, a);
    const opp = d.opportunities.find((o) => o.id === a.opportunityId);
    const m = d.matches.find((x) => x.id === a.matchId);
    if (m && m.status !== "Application Started") m.status = "Application Started";
    log(d, { type: "status", message: `${opp?.title ?? "Application"} moved from ${prev} to ${status}.`, applicationId: id, clientId: a.clientId, opportunityId: a.opportunityId });
    if (status === "Ready to Submit") notify(d, { type: "submission", title: "Application ready for submission", body: `${opp?.title} is Ready to Submit.`, href: `/applications/${id}?tab=submission` });
  });
}

export function toggleChecklist(id: string, key: ChecklistKey) {
  update((d) => {
    const a = findApp(d, id);
    a.checklist[key] = !a.checklist[key];
    touchApp(d, a);
  });
}

export function updateSection(appId: string, sectionId: string, patch: Partial<ApplicationSection>, opts: { log?: string } = {}) {
  update((d) => {
    const a = findApp(d, appId);
    const s = a.sections.find((x) => x.id === sectionId);
    if (!s) return;
    Object.assign(s, patch, { updatedAt: now() });
    if (s.content.trim() && !a.checklist.narrativeStarted) a.checklist.narrativeStarted = true;
    a.updatedAt = now();
    if (opts.log) log(d, { type: "writing", message: opts.log, applicationId: appId, clientId: a.clientId });
  });
}

export function updateCompliance(appId: string, reqId: string, patch: Partial<ComplianceRequirement>) {
  update((d) => {
    const a = findApp(d, appId);
    const r = a.compliance.find((x) => x.id === reqId);
    if (!r) return;
    Object.assign(r, patch);
    touchApp(d, a);
  });
}

export function addComplianceRequirement(appId: string, input: Omit<ComplianceRequirement, "id">) {
  update((d) => {
    const a = findApp(d, appId);
    a.compliance.push({ ...input, id: uid("cr") });
    touchApp(d, a);
  });
}

function syncBudget(a: Application) {
  a.fundingRequested = budgetTotals(a.budget).federalRequest;
}

export function updateBudgetItem(appId: string, itemId: string, patch: Partial<BudgetItem>) {
  update((d) => {
    const a = findApp(d, appId);
    const it = a.budget.items.find((x) => x.id === itemId);
    if (!it) return;
    Object.assign(it, patch);
    syncBudget(a);
    touchApp(d, a);
  });
}

export function addBudgetItem(appId: string, category: BudgetCategory) {
  update((d) => {
    const a = findApp(d, appId);
    a.budget.items.push({ id: uid("bi"), category, description: `New ${category.toLowerCase()} item`, quantity: 1, rate: 0, allowable: "Review", notes: "" });
    touchApp(d, a);
  });
}

export function removeBudgetItem(appId: string, itemId: string) {
  update((d) => {
    const a = findApp(d, appId);
    a.budget.items = a.budget.items.filter((x) => x.id !== itemId);
    syncBudget(a);
    touchApp(d, a);
  });
}

export function updateBudgetSettings(appId: string, patch: Partial<Omit<ApplicationBudget, "items">>) {
  update((d) => {
    const a = findApp(d, appId);
    a.budget = { ...a.budget, ...patch };
    syncBudget(a);
    touchApp(d, a);
  });
}

export function markBudgetComplete(appId: string) {
  update((d) => {
    const a = findApp(d, appId);
    a.checklist.budgetCompleted = true;
    const s = a.sections.find((x) => x.key === "budget-narrative");
    if (s && a.budget.narrative) {
      s.content = a.budget.narrative;
      s.status = "Complete";
    }
    touchApp(d, a);
    log(d, { type: "budget", message: `Budget completed — federal request ${formatCurrency(a.fundingRequested)}.`, applicationId: appId, clientId: a.clientId });
  });
}

export function markHandoffOpened(appId: string) {
  update((d) => {
    const a = findApp(d, appId);
    a.submission.handoffOpenedAt = now();
    log(d, { type: "submission", message: "Grants.gov Workspace handoff opened.", applicationId: appId, clientId: a.clientId });
  });
}

export function markSubmitted(appId: string, submittedAt: string, trackingNumber: string) {
  update((d) => {
    const a = findApp(d, appId);
    a.status = "Submitted";
    a.submission = { ...a.submission, submittedAt, trackingNumber, submittedBy: d.settings.currentUserId };
    a.nextAction = "Monitor agency status and prepare for clarification requests";
    touchApp(d, a);
    const opp = d.opportunities.find((o) => o.id === a.opportunityId);
    log(d, { type: "submission", message: `${opp?.title} marked Submitted (tracking ${trackingNumber}).`, applicationId: appId, clientId: a.clientId, opportunityId: a.opportunityId });
    notify(d, { type: "submission", title: "Submission recorded", body: `${opp?.title} — tracking ${trackingNumber}.`, href: `/applications/${appId}?tab=submission` });
  });
}

export function recordOutcome(appId: string, outcome: Omit<OutcomeRecord, "decidedAt"> & { decidedAt?: string }) {
  update((d) => {
    const a = findApp(d, appId);
    a.status = outcome.decision;
    a.outcome = { ...outcome, decidedAt: outcome.decidedAt ?? now() };
    a.nextAction = outcome.decision === "Awarded" ? "Post-award kickoff and reporting calendar" : "Request reviewer debrief";
    touchApp(d, a);
    const opp = d.opportunities.find((o) => o.id === a.opportunityId);
    log(d, {
      type: "status",
      message: outcome.decision === "Awarded" ? `Award recorded: ${opp?.title} (${formatCurrency(outcome.amountAwarded)}).` : `Outcome recorded: ${opp?.title} not awarded.`,
      applicationId: appId,
      clientId: a.clientId,
    });
    if (outcome.decision === "Awarded") notify(d, { type: "award", title: "Award recorded", body: `${opp?.title} — ${formatCurrency(outcome.amountAwarded)}.`, href: `/applications/${appId}` });
  });
}

// ---------------------------------------------------------------- Documents

export interface FileMeta {
  name: string;
  sizeBytes: number;
}

export function addDocuments(files: FileMeta[], meta: Partial<Pick<DocumentItem, "category" | "scope" | "clientId" | "applicationId">>) {
  update((d) => {
    for (const f of files) {
      d.documents.unshift({
        id: uid("d"),
        name: f.name,
        fileType: (f.name.split(".").pop() ?? "FILE").toUpperCase(),
        category: meta.category ?? "Other",
        scope: meta.scope ?? (meta.applicationId ? "application" : meta.clientId ? "client" : "template"),
        clientId: meta.clientId,
        applicationId: meta.applicationId,
        sizeBytes: f.sizeBytes,
        updatedAt: now(),
        status: "Received",
        uploadedBy: d.settings.currentUserId,
        version: 1,
      });
    }
    log(d, { type: "document", message: `${files.length === 1 ? files[0].name : `${files.length} documents`} uploaded.`, clientId: meta.clientId, applicationId: meta.applicationId });
    touchClient(d, meta.clientId);
  });
}

export function updateDocument(id: string, patch: Partial<DocumentItem>) {
  update((d) => {
    const doc = d.documents.find((x) => x.id === id);
    if (doc) Object.assign(doc, patch, { updatedAt: now() });
  });
}

export function markDocumentReceived(id: string) {
  update((d) => {
    const doc = d.documents.find((x) => x.id === id);
    if (!doc) return;
    doc.status = "Received";
    doc.updatedAt = now();
    if (!doc.sizeBytes) doc.sizeBytes = 240 * 1024;
    // Close any matching compliance requirement / request item.
    for (const r of d.documentRequests.filter((x) => x.applicationId === doc.applicationId)) {
      for (const it of r.items) if (it.category === doc.category && it.status !== "Received") it.status = "Received";
      r.status = r.items.every((i) => i.status === "Received") ? "Received" : "Partially Received";
    }
    log(d, { type: "document", message: `${doc.name} marked received.`, clientId: doc.clientId, applicationId: doc.applicationId });
  });
}

export function replaceDocument(id: string, file: FileMeta) {
  update((d) => {
    const doc = d.documents.find((x) => x.id === id);
    if (!doc) return;
    doc.name = file.name;
    doc.sizeBytes = file.sizeBytes;
    doc.fileType = (file.name.split(".").pop() ?? doc.fileType).toUpperCase();
    doc.version += 1;
    doc.status = "Received";
    doc.updatedAt = now();
    log(d, { type: "document", message: `${file.name} replaced (v${doc.version}).`, clientId: doc.clientId, applicationId: doc.applicationId });
  });
}

export function deleteDocument(id: string) {
  update((d) => {
    d.documents = d.documents.filter((x) => x.id !== id);
  });
}

export function attachDocument(id: string, applicationId: string) {
  update((d) => {
    const doc = d.documents.find((x) => x.id === id);
    const app = d.applications.find((a) => a.id === applicationId);
    if (!doc || !app) return;
    doc.applicationId = applicationId;
    doc.clientId = doc.clientId ?? app.clientId;
    if (doc.scope === "client") doc.scope = "application";
    log(d, { type: "document", message: `${doc.name} attached to application.`, applicationId, clientId: app.clientId });
  });
}

// ---------------------------------------------------------------- Document requests

export function createDocumentRequest(input: Pick<DocumentRequest, "applicationId" | "clientId" | "contactId" | "message" | "dueDate"> & { items: { name: string; category: DocumentItem["category"] }[] }): string {
  const id = uid("dr");
  update((d) => {
    d.documentRequests.unshift({
      id,
      applicationId: input.applicationId,
      clientId: input.clientId,
      contactId: input.contactId,
      message: input.message,
      dueDate: input.dueDate,
      items: input.items.map((i) => ({ ...i, id: uid("dri"), status: "Requested" })),
      status: "Draft",
      createdAt: now(),
    });
  });
  return id;
}

export function sendDocumentRequest(id: string) {
  update((d) => {
    const r = d.documentRequests.find((x) => x.id === id);
    if (!r) return;
    r.status = "Sent";
    r.sentAt = now();
    const client = d.clients.find((c) => c.id === r.clientId);
    const contact = d.contacts.find((c) => c.id === r.contactId);
    // Track each requested item as a pending document in the vault.
    for (const it of r.items) {
      const exists = d.documents.some((doc) => doc.applicationId === r.applicationId && doc.name.toLowerCase().includes(it.name.toLowerCase().slice(0, 12)));
      if (!exists) {
        d.documents.unshift({
          id: uid("d"),
          name: `${it.name.replace(/[^A-Za-z0-9]+/g, "_").replace(/_+$/, "")}.pdf`,
          fileType: "PDF",
          category: it.category,
          scope: "application",
          clientId: r.clientId,
          applicationId: r.applicationId,
          sizeBytes: 0,
          updatedAt: now(),
          status: "Requested",
          uploadedBy: "client",
          version: 1,
        });
      }
    }
    d.tasks.unshift({
      id: uid("t"),
      title: `Client to provide ${r.items.length} requested document${r.items.length === 1 ? "" : "s"}`,
      applicationId: r.applicationId,
      clientId: r.clientId,
      ownerId: "client",
      dueDate: r.dueDate,
      priority: "High",
      status: "To Do",
      type: "Documents",
      createdAt: now(),
    });
    log(d, { type: "document", message: `Document request sent to ${contact?.name ?? client?.name} (${r.items.length} items).`, applicationId: r.applicationId, clientId: r.clientId });
    touchClient(d, r.clientId);
  });
}

export function markRequestItemReceived(requestId: string, itemId: string) {
  update((d) => {
    const r = d.documentRequests.find((x) => x.id === requestId);
    const it = r?.items.find((x) => x.id === itemId);
    if (!r || !it) return;
    it.status = "Received";
    r.status = r.items.every((i) => i.status === "Received") ? "Received" : "Partially Received";
    const doc = d.documents.find((x) => x.applicationId === r.applicationId && x.category === it.category && (x.status === "Requested" || x.status === "Overdue"));
    if (doc) {
      doc.status = "Received";
      doc.sizeBytes = doc.sizeBytes || 310 * 1024;
      doc.updatedAt = now();
    }
    log(d, { type: "document", message: `Client provided: ${it.name}.`, actorId: "client", applicationId: r.applicationId, clientId: r.clientId });
    notify(d, { type: "document", title: "Client uploaded requested document", body: it.name, href: "/documents?tab=requests" });
  });
}

// ---------------------------------------------------------------- Tasks

export function addTask(input: Omit<Task, "id" | "createdAt">): string {
  const id = uid("t");
  update((d) => {
    d.tasks.unshift({ ...input, id, createdAt: now() });
  });
  return id;
}

export function updateTask(id: string, patch: Partial<Task>) {
  update((d) => {
    const t = d.tasks.find((x) => x.id === id);
    if (t) Object.assign(t, patch);
  });
}

export function toggleTaskComplete(id: string) {
  update((d) => {
    const t = d.tasks.find((x) => x.id === id);
    if (!t) return;
    const done = t.status !== "Done";
    t.status = done ? "Done" : "To Do";
    t.completedAt = done ? now() : undefined;
    if (done) log(d, { type: "task", message: `Task completed: ${t.title}.`, applicationId: t.applicationId, clientId: t.clientId });
  });
}

export function deleteTask(id: string) {
  update((d) => {
    d.tasks = d.tasks.filter((x) => x.id !== id);
  });
}

// ---------------------------------------------------------------- Reviews

function findReview(d: AppData, id: string): Review | undefined {
  return d.reviews.find((r) => r.id === id);
}

export function addReviewComment(reviewId: string, body: string, sectionTitle?: string) {
  update((d) => {
    const r = findReview(d, reviewId);
    if (!r) return;
    const user = d.team.find((t) => t.id === d.settings.currentUserId)!;
    r.comments.unshift({ id: uid("rc"), authorId: user.id, authorName: user.name, body, sectionTitle, createdAt: now(), resolved: false, replies: [] });
    if (r.status === "Not Started") r.status = "In Progress";
    log(d, { type: "review", message: `Comment added to ${r.type}${sectionTitle ? ` (${sectionTitle})` : ""}.`, applicationId: r.applicationId });
  });
}

export function replyToComment(reviewId: string, commentId: string, body: string) {
  update((d) => {
    const c = findReview(d, reviewId)?.comments.find((x) => x.id === commentId);
    if (!c) return;
    const user = d.team.find((t) => t.id === d.settings.currentUserId)!;
    c.replies.push({ id: uid("rr"), authorId: user.id, authorName: user.name, body, createdAt: now() });
  });
}

export function resolveComment(reviewId: string, commentId: string, resolved = true) {
  update((d) => {
    const c = findReview(d, reviewId)?.comments.find((x) => x.id === commentId);
    if (c) c.resolved = resolved;
  });
}

export function setReviewStatus(reviewId: string, status: ReviewStatus) {
  update((d) => {
    const r = findReview(d, reviewId);
    if (!r) return;
    r.status = status;
    const a = d.applications.find((x) => x.id === r.applicationId);
    if (status === "Approved") {
      r.approvedAt = now();
      r.comments.forEach((c) => (c.resolved = true));
      if (a) {
        if (r.type === "Internal Review") a.checklist.internalReviewCompleted = true;
        if (r.type === "Client Review") a.checklist.clientApprovalCompleted = true;
        if (r.type === "Compliance Review") a.compliance.forEach((c) => c.status === "Needs Review" && (c.status = "Complete"));
      }
      log(d, { type: "review", message: `${r.type} approved.`, applicationId: r.applicationId, clientId: a?.clientId });
      notify(d, { type: "review", title: `${r.type} completed`, body: d.opportunities.find((o) => o.id === a?.opportunityId)?.title ?? "", href: `/applications/${r.applicationId}?tab=reviews` });
    }
  });
}

// ---------------------------------------------------------------- Notifications

export function markNotificationRead(id: string) {
  update((d) => {
    const n = d.notifications.find((x) => x.id === id);
    if (n) n.read = true;
  });
}

export function markAllNotificationsRead() {
  update((d) => d.notifications.forEach((n) => (n.read = true)));
}

export function dismissNotification(id: string) {
  update((d) => {
    d.notifications = d.notifications.filter((x) => x.id !== id);
  });
}

// ---------------------------------------------------------------- Settings

export function updateSettings(patch: Partial<Settings>) {
  update((d) => {
    d.settings = { ...d.settings, ...patch };
  });
}

export function resetDemo() {
  resetState();
}

/** Escape hatch for feature code that needs a bespoke mutation. Prefer named actions. */
export { update as mutate };
