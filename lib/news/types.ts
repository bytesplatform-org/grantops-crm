// Shared types for the Grant News module (safe to import on client and server).

export type NewsSourceId = "federal-register" | "grants-gov" | "grants-gov-blog";

export type NewsKind = "Funding notice" | "New opportunity" | "Forecast" | "Policy & guidance" | "Grants.gov update";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: NewsSourceId;
  kind: NewsKind;
  /** Cabinet-level department, normalized to "Department of X" where possible. */
  agency?: string;
  /** Sub-agency or office, when the source provides one. */
  office?: string;
  publishedAt: string;
  closeDate?: string;
}

export interface NewsSourceStatus {
  id: NewsSourceId;
  label: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface NewsResponse {
  items: NewsItem[];
  sources: NewsSourceStatus[];
  fetchedAt: string;
}

export const NEWS_SOURCES: Record<NewsSourceId, { label: string; home: string }> = {
  "federal-register": { label: "Federal Register", home: "https://www.federalregister.gov" },
  "grants-gov": { label: "Grants.gov", home: "https://www.grants.gov" },
  "grants-gov-blog": { label: "Grants.gov Community Blog", home: "https://grantsgovprod.wordpress.com" },
};
