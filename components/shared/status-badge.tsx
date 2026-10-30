import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  ApplicationStatus,
  ComplianceStatus,
  DocumentStatus,
  LeadStage,
  MatchRecommendation,
  OpportunityStatus,
  ReviewStatus,
  SectionStatus,
  TaskPriority,
  TaskStatus,
  ClientStatus,
} from "@/lib/types";

type V = NonNullable<BadgeProps["variant"]>;

export const APP_STATUS_VARIANT: Record<ApplicationStatus, V> = {
  Researching: "secondary",
  "Eligibility Confirmed": "info",
  Preparing: "info",
  Writing: "default",
  "Internal Review": "violet",
  "Client Review": "violet",
  "Ready to Submit": "warning",
  Submitted: "dark",
  Awarded: "success",
  "Not Awarded": "danger",
  Withdrawn: "secondary",
};

/** Accent colors per status for kanban column dots and charts. */
export const APP_STATUS_COLOR: Record<ApplicationStatus, string> = {
  Researching: "#94a3b8",
  "Eligibility Confirmed": "#38bdf8",
  Preparing: "#0ea5e9",
  Writing: "#202327",
  "Internal Review": "#7c3aed",
  "Client Review": "#a855f7",
  "Ready to Submit": "#f59e0b",
  Submitted: "#334155",
  Awarded: "#059669",
  "Not Awarded": "#dc2626",
  Withdrawn: "#cbd5e1",
};

export function ApplicationStatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <Badge variant={APP_STATUS_VARIANT[status]} dot className={className}>
      {status}
    </Badge>
  );
}

export const RECOMMENDATION_STYLE: Record<MatchRecommendation, { variant: V; ring: string; text: string; bg: string }> = {
  Pursue: { variant: "success", ring: "#059669", text: "text-emerald-700", bg: "bg-emerald-50" },
  Investigate: { variant: "warning", ring: "#d97706", text: "text-amber-700", bg: "bg-amber-50" },
  "Low Priority": { variant: "secondary", ring: "#94a3b8", text: "text-slate-600", bg: "bg-slate-100" },
  "Not Eligible": { variant: "danger", ring: "#dc2626", text: "text-red-700", bg: "bg-red-50" },
};

export function RecommendationBadge({ value, className }: { value: MatchRecommendation; className?: string }) {
  return (
    <Badge variant={RECOMMENDATION_STYLE[value].variant} className={className}>
      {value.toUpperCase()}
    </Badge>
  );
}

const COMPLIANCE_VARIANT: Record<ComplianceStatus, V> = { Complete: "success", "In Progress": "info", Missing: "danger", "Needs Review": "warning" };
export function ComplianceStatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <Badge variant={COMPLIANCE_VARIANT[status]} dot>
      {status}
    </Badge>
  );
}

const DOC_VARIANT: Record<DocumentStatus, V> = { Received: "info", Approved: "success", Requested: "secondary", Overdue: "danger", Expiring: "warning", Draft: "outline" };
export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <Badge variant={DOC_VARIANT[status]} dot>
      {status}
    </Badge>
  );
}

const PRIORITY_VARIANT: Record<TaskPriority, V> = { Low: "secondary", Medium: "info", High: "warning", Urgent: "danger" };
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant={PRIORITY_VARIANT[priority]}>{priority}</Badge>;
}

const TASK_VARIANT: Record<TaskStatus, V> = { "To Do": "secondary", "In Progress": "info", Done: "success" };
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={TASK_VARIANT[status]} dot>
      {status}
    </Badge>
  );
}

export const LEAD_STAGE_VARIANT: Record<LeadStage, V> = {
  "New Lead": "secondary",
  Contacted: "info",
  "Discovery Scheduled": "default",
  Qualified: "dark",
  "Proposal Sent": "violet",
  Negotiation: "warning",
  Won: "success",
  Lost: "danger",
};
export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return (
    <Badge variant={LEAD_STAGE_VARIANT[stage]} dot>
      {stage}
    </Badge>
  );
}

const SECTION_VARIANT: Record<SectionStatus, V> = { "Not Started": "secondary", Drafting: "info", "In Review": "warning", Complete: "success" };
export function SectionStatusBadge({ status }: { status: SectionStatus }) {
  return (
    <Badge variant={SECTION_VARIANT[status]} dot>
      {status}
    </Badge>
  );
}

const REVIEW_VARIANT: Record<ReviewStatus, V> = { "Not Started": "secondary", "In Progress": "info", "Changes Requested": "warning", Approved: "success" };
export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge variant={REVIEW_VARIANT[status]} dot>
      {status}
    </Badge>
  );
}

const OPP_VARIANT: Record<OpportunityStatus, V> = { Posted: "success", Forecasted: "info", "Closing Soon": "warning", Closed: "secondary", Archived: "secondary" };
export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <Badge variant={OPP_VARIANT[status]} dot>
      {status}
    </Badge>
  );
}

const CLIENT_VARIANT: Record<ClientStatus, V> = { Active: "success", Onboarding: "info", Paused: "warning", Inactive: "secondary" };
export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant={CLIENT_VARIANT[status]} dot>
      {status}
    </Badge>
  );
}

export function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const v: Record<string, V> = { Low: "success", Medium: "warning", High: "danger" };
  return <Badge variant={v[risk]}>{risk} risk</Badge>;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      Demo Opportunity
    </Badge>
  );
}
