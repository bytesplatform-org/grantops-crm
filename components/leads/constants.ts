import type { OrganizationType, ProposalStatus } from "@/lib/types";

export const ORG_TYPES: OrganizationType[] = [
  "Small Business",
  "Nonprofit",
  "Tribal Organization",
  "Local Government",
  "Institution of Higher Education",
  "Cooperative",
  "Workforce Board",
];

export const PROPOSAL_STATUSES: ProposalStatus[] = ["Not Started", "Drafting", "Sent", "Accepted", "Declined"];

export const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");
export const fromDateInput = (v: string) => (v ? new Date(`${v}T10:00:00`).toISOString() : new Date().toISOString());
export const splitList = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
