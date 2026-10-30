import type { Client } from "@/lib/types";
import type { NewsItem } from "@/lib/news/types";

export interface ClientRelevance {
  client: Client;
  /** Why it matched: a keyword/interest found in the text, or a preferred agency. */
  reason: string;
  strong: boolean;
}

const norm = (s: string) => s.toLowerCase();

// Single words ("cooperative", "education") match far too much federal text,
// so only multi-word phrases count, matched on word boundaries.
const isPhrase = (k: string) => k.trim().includes(" ");
const phraseIn = (text: string, k: string) => new RegExp(`\\b${norm(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text);

/**
 * Which active clients a news item may matter to. A keyword or funding interest
 * appearing in the headline/summary is a strong signal; a notice from one of the
 * client's preferred agencies is a weaker one.
 */
export function relevantClients(item: NewsItem, clients: Client[]): ClientRelevance[] {
  const text = norm(`${item.title} ${item.summary}`);
  const out: ClientRelevance[] = [];
  for (const c of clients) {
    if (c.status !== "Active" && c.status !== "Onboarding") continue;
    const term = [...c.fundingProfile.keywords, ...c.fundingInterests].find((k) => isPhrase(k) && phraseIn(text, k));
    if (term) {
      out.push({ client: c, reason: `Mentions “${term}”`, strong: true });
      continue;
    }
    if (item.agency && item.source !== "grants-gov-blog" && c.fundingProfile.preferredAgencies.some((a) => norm(a) === norm(item.agency!))) {
      out.push({ client: c, reason: `Preferred agency: ${item.agency}`, strong: false });
    }
  }
  return out.sort((a, b) => Number(b.strong) - Number(a.strong));
}
