"use client";
import { toast } from "sonner";
import { matchClientsToOpportunity } from "@/lib/data-service";

/** Run matching for an opportunity and report the result. */
export function runMatchClients(opportunityId: string, title: string, go: (href: string) => void) {
  const results = matchClientsToOpportunity(opportunityId);
  if (!results.length) {
    toast("No potential matches found", { description: `No active clients scored 40% or higher for ${title}.` });
    return;
  }
  const best = [...results].sort((a, b) => b.score - a.score)[0];
  toast.success(`${results.length} potential match${results.length === 1 ? "" : "es"} found`, {
    description: `${title} · top score ${best.score}%`,
    action: { label: "View matches", onClick: () => go(`/matches?match=${best.id}`) },
  });
}
