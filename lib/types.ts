// Core domain types for the GrantOS demo workspace.
// All data is persisted client-side (localStorage) through lib/data-service.ts.

export type ID = string;
export type ISODate = string;

export interface TeamMember {
  id: ID;
  name: string;
  role: string;
  initials: string;
  email: string;
  color: string; // tailwind bg class for avatar
}

export type OrganizationType =
  | "Small Business"
  | "Nonprofit"
  | "Tribal Organization"
  | "Local Government"
  | "Institution of Higher Education"
  | "Cooperative"
  | "Workforce Board";

export interface Note {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: ISODate;
}

// ---------------------------------------------------------------- Leads

export const LEAD_STAGES = [
  "New Inquiry",
  "Discovery Scheduled",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export type ProposalStatus = "Not Started" | "Drafting" | "Sent" | "Accepted" | "Declined";

export interface LeadTask {
  id: ID;
  title: string;
  dueDate: ISODate;
  done: boolean;
}

export interface Lead {
  id: ID;
  company: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  organizationType: OrganizationType;
  location: string;
  fundingNeed: string;
  estimatedValue: number;
  source: string;
  lastContact: ISODate;
  stage: LeadStage;
  nextAction: string;
  nextActionDate: ISODate;
  ownerId: ID;
  fundingGoals: string[];
  grantCategories: string[];
  proposalStatus: ProposalStatus;
  proposalValue: number; // consulting engagement value
  notes: Note[];
  tasks: LeadTask[];
  createdAt: ISODate;
}

// ---------------------------------------------------------------- Clients

export type ClientStatus = "Active" | "Onboarding" | "Paused" | "Inactive";

export interface PastAward {
  title: string;
  agency: string;
  amount: number;
  year: number;
}

export interface FundingProfile {
  objectives: string[];
  targetAmount: number;
  preferredAgencies: string[];
  eligibleOrgTypes: string[];
  geography: string[];
  keywords: string[];
  pastAwards: PastAward[];
  constraints: string[];
  matchCapacityPct: number; // max cost-share the client can support
}

export interface Client {
  id: ID;
  name: string;
  organizationType: OrganizationType;
  industry: string;
  city: string;
  state: string; // full state name
  naics: string[];
  serviceArea: string;
  fundingInterests: string[];
  certifications: string[];
  status: ClientStatus;
  potentialFunding: number;
  lastActivity: ISODate;
  summary: string;
  capabilities: string[];
  serviceAreas: string[];
  employees: number;
  annualRevenue: string;
  yearFounded: number;
  website: string;
  samRegistration: "Active" | "Renewal Due" | "In Progress";
  accountManagerId: ID;
  fundingProfile: FundingProfile;
  createdAt: ISODate;
}

export interface Contact {
  id: ID;
  clientId: ID;
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  role: "Executive Sponsor" | "Primary Contact" | "Finance" | "Program Lead" | "Signatory";
}

// ---------------------------------------------------------------- Opportunities

export type OpportunityStatus = "Posted" | "Forecasted" | "Closing Soon" | "Closed" | "Archived";
export type FundingInstrument = "Grant" | "Cooperative Agreement" | "Grant / Cooperative Agreement";

export interface Opportunity {
  id: ID;
  isDemo: true; // all seeded opportunities are fictional sample data
  title: string;
  agency: string;
  agencyCode: string;
  subAgency: string;
  opportunityNumber: string;
  assistanceListing: string;
  instrument: FundingInstrument;
  estimatedFunding: number; // total program funding
  awardCeiling: number;
  awardFloor: number;
  expectedAwards: number;
  postedDate: ISODate;
  deadline: ISODate;
  category: string;
  eligibility: OrganizationType[];
  status: OpportunityStatus;
  costSharePct: number;
  periodOfPerformance: string;
  summary: string;
  keywords: string[];
  eligibleStates?: string[]; // undefined = nationwide
  saved: boolean;
}

export interface EvaluationCriterion {
  criterion: string;
  points: number;
  description: string;
}

export interface NOFOAnalysis {
  opportunityId: ID;
  analyzedAt: ISODate;
  analyzedBy: ID;
  summary: string;
  programPurpose: string;
  eligibleApplicants: string[];
  fundingRange: string;
  periodOfPerformance: string;
  applicationDeadline: ISODate;
  costSharing: string;
  keyPriorities: string[];
  keyRequirements: string[];
  requiredAttachments: string[];
  submissionRequirements: string[];
  evaluationCriteria: EvaluationCriterion[];
  importantDates: { label: string; date: ISODate }[];
  risks: string[];
}

// ---------------------------------------------------------------- Matching

export type MatchRecommendation = "Pursue" | "Investigate" | "Low Priority" | "Not Eligible";
export type MatchStatus = "New" | "Reviewing" | "Approved" | "Application Started" | "Dismissed";

export interface MatchBreakdown {
  organizationEligibility: number;
  industryAlignment: number;
  geographicFit: number;
  fundingAlignment: number;
  pastPerformance: number;
  timelineFeasibility: number;
}

export type GoNoGoCriterion =
  | "eligibility"
  | "strategicAlignment"
  | "competitivePosition"
  | "resourceReadiness"
  | "deadlineFeasibility";

export interface GoNoGoAssessment {
  scores: Record<GoNoGoCriterion, 0 | 1 | 2 | null>;
  notes: string;
  approved: boolean;
  approvedAt?: ISODate;
  approvedBy?: ID;
  updatedAt: ISODate;
}

export interface GrantMatch {
  id: ID;
  clientId: ID;
  opportunityId: ID;
  score: number;
  breakdown: MatchBreakdown;
  recommendation: MatchRecommendation;
  reasons: string[];
  risks: string[];
  status: MatchStatus;
  goNoGo?: GoNoGoAssessment;
  applicationId?: ID;
  createdAt: ISODate;
}

// ---------------------------------------------------------------- Applications

export const APPLICATION_STATUSES = [
  "Researching",
  "Eligibility Confirmed",
  "Preparing",
  "Writing",
  "Internal Review",
  "Client Review",
  "Ready to Submit",
  "Submitted",
  "Awarded",
  "Not Awarded",
  "Withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const CHECKLIST_ITEMS = [
  { key: "eligibilityVerified", label: "Eligibility verified" },
  { key: "clientApprovedPursuit", label: "Client approved pursuit" },
  { key: "nofoAnalyzed", label: "NOFO analyzed" },
  { key: "narrativeStarted", label: "Narrative started" },
  { key: "budgetCompleted", label: "Budget completed" },
  { key: "documentsCollected", label: "Required documents collected" },
  { key: "internalReviewCompleted", label: "Internal review completed" },
  { key: "clientApprovalCompleted", label: "Client approval completed" },
  { key: "readyToSubmit", label: "Ready to submit" },
] as const;
export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["key"];

export type SectionStatus = "Not Started" | "Drafting" | "In Review" | "Complete";

export interface ApplicationSection {
  id: ID;
  key: string;
  title: string;
  content: string;
  status: SectionStatus;
  wordLimit: number;
  requirement: string;
  guidance: string;
  evidence: string[];
  assigneeId: ID;
  updatedAt: ISODate;
}

export type ComplianceStatus = "Complete" | "In Progress" | "Missing" | "Needs Review";

export interface ComplianceRequirement {
  id: ID;
  requirement: string;
  source: string;
  assignedSection: string;
  evidence: string;
  ownerId: ID | "client";
  status: ComplianceStatus;
}

export const BUDGET_CATEGORIES = [
  "Personnel",
  "Fringe",
  "Travel",
  "Equipment",
  "Supplies",
  "Contractual",
  "Other",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export interface BudgetItem {
  id: ID;
  category: BudgetCategory;
  description: string;
  quantity: number;
  rate: number;
  allowable: "Yes" | "Review" | "No";
  notes: string;
}

export interface ApplicationBudget {
  items: BudgetItem[];
  indirectRatePct: number; // applied to modified total direct costs (excludes equipment)
  matchPct: number; // client cost share as % of total project cost
  narrative: string;
}

export interface SubmissionRecord {
  handoffOpenedAt?: ISODate;
  submittedAt?: ISODate;
  trackingNumber?: string;
  submittedBy?: ID;
}

export interface OutcomeRecord {
  decision: "Awarded" | "Not Awarded";
  decidedAt: ISODate;
  amountAwarded: number;
  notes: string;
}

export interface Application {
  id: ID;
  opportunityId: ID;
  clientId: ID;
  matchId?: ID;
  status: ApplicationStatus;
  fundingRequested: number;
  deadline: ISODate;
  internalDeadline: ISODate;
  writerId: ID;
  managerId: ID;
  risk: "Low" | "Medium" | "High";
  nextAction: string;
  notes: string;
  checklist: Record<ChecklistKey, boolean>;
  sections: ApplicationSection[];
  compliance: ComplianceRequirement[];
  budget: ApplicationBudget;
  submission: SubmissionRecord;
  outcome?: OutcomeRecord;
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ---------------------------------------------------------------- Documents

export type DocumentScope = "client" | "application" | "template";
export type DocumentStatus = "Received" | "Approved" | "Requested" | "Overdue" | "Expiring" | "Draft";
export type DocumentCategory =
  | "Capability Statement"
  | "Organization Chart"
  | "Resume"
  | "Financial Statement"
  | "Budget"
  | "Past Performance"
  | "Letter of Support"
  | "Policy"
  | "Certification"
  | "Narrative"
  | "Federal Form"
  | "Template"
  | "Other";

export interface DocumentItem {
  id: ID;
  name: string;
  fileType: string; // PDF, XLSX, DOCX...
  category: DocumentCategory;
  scope: DocumentScope;
  clientId?: ID;
  applicationId?: ID;
  sizeBytes: number;
  updatedAt: ISODate;
  expiresAt?: ISODate;
  status: DocumentStatus;
  uploadedBy: ID | "client";
  version: number;
}

export type RequestItemStatus = "Requested" | "Received" | "Overdue";

export interface DocumentRequestItem {
  id: ID;
  name: string;
  category: DocumentCategory;
  status: RequestItemStatus;
}

export interface DocumentRequest {
  id: ID;
  applicationId: ID;
  clientId: ID;
  contactId?: ID;
  items: DocumentRequestItem[];
  message: string;
  status: "Draft" | "Sent" | "Partially Received" | "Received" | "Overdue";
  createdAt: ISODate;
  sentAt?: ISODate;
  dueDate: ISODate;
}

// ---------------------------------------------------------------- Tasks / activity

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskType = "Writing" | "Documents" | "Review" | "Client" | "Submission" | "Research";

export interface Task {
  id: ID;
  title: string;
  applicationId?: ID;
  clientId?: ID;
  ownerId: ID | "client";
  dueDate: ISODate;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  createdAt: ISODate;
  completedAt?: ISODate;
}

export type ActivityType =
  | "eligibility"
  | "document"
  | "writing"
  | "match"
  | "status"
  | "budget"
  | "review"
  | "task"
  | "client"
  | "lead"
  | "submission"
  | "analysis"
  | "note";

export interface Activity {
  id: ID;
  type: ActivityType;
  message: string;
  actorId: ID | "client" | "system";
  clientId?: ID;
  applicationId?: ID;
  opportunityId?: ID;
  leadId?: ID;
  createdAt: ISODate;
}

export type NotificationType = "match" | "document" | "deadline" | "review" | "submission" | "task" | "award";

export interface AppNotification {
  id: ID;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: ISODate;
}

// ---------------------------------------------------------------- Reviews

export type ReviewType = "Internal Review" | "Client Review" | "Compliance Review";
export type ReviewStatus = "Not Started" | "In Progress" | "Changes Requested" | "Approved";

export interface ReviewReply {
  id: ID;
  authorId: ID | "client";
  authorName: string;
  body: string;
  createdAt: ISODate;
}

export interface ReviewComment {
  id: ID;
  authorId: ID | "client";
  authorName: string;
  sectionTitle?: string;
  body: string;
  createdAt: ISODate;
  resolved: boolean;
  replies: ReviewReply[];
}

export interface Review {
  id: ID;
  applicationId: ID;
  type: ReviewType;
  reviewers: string[]; // display names
  status: ReviewStatus;
  dueDate: ISODate;
  comments: ReviewComment[];
  approvedAt?: ISODate;
}

// ---------------------------------------------------------------- Settings / root

export interface Settings {
  firmName: string;
  currentUserId: ID;
  defaultApplicationView: "kanban" | "table";
  compactTables: boolean;
  notificationPrefs: {
    newMatches: boolean;
    documentUploads: boolean;
    deadlineReminders: boolean;
    reviewUpdates: boolean;
    weeklyDigest: boolean;
  };
  deadlineReminderDays: number;
}

export interface AppData {
  version: number;
  seededAt: ISODate;
  team: TeamMember[];
  leads: Lead[];
  clients: Client[];
  contacts: Contact[];
  opportunities: Opportunity[];
  nofoAnalyses: Record<ID, NOFOAnalysis>;
  matches: GrantMatch[];
  applications: Application[];
  documents: DocumentItem[];
  documentRequests: DocumentRequest[];
  tasks: Task[];
  activities: Activity[];
  notifications: AppNotification[];
  reviews: Review[];
  settings: Settings;
}
