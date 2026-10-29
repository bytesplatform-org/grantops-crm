import type { AppData } from "@/lib/types";
import { applicationCompletion } from "@/lib/selectors";

function esc(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadApplicationsCsv(data: AppData) {
  const header = ["Application ID", "Grant", "Agency", "Opportunity Number", "Client", "Status", "Funding Requested", "Deadline", "Completion %", "Writer", "Risk", "Amount Awarded"];
  const rows = data.applications.map((a) => {
    const o = data.opportunities.find((x) => x.id === a.opportunityId);
    const c = data.clients.find((x) => x.id === a.clientId);
    const w = data.team.find((x) => x.id === a.writerId);
    return [a.id, o?.title ?? "", o?.agency ?? "", o?.opportunityNumber ?? "", c?.name ?? "", a.status, a.fundingRequested, a.deadline.slice(0, 10), applicationCompletion(a), w?.name ?? "", a.risk, a.outcome?.amountAwarded ?? ""];
  });
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grantos-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
