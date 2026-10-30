// Server-only fetchers for the Grant News module. Each source is cached on its
// own for an hour ("use cache" + cacheLife), and a failing source throws so the
// failure is never cached — the route reports it and serves the other sources.
import { cacheLife } from "next/cache";
import { NEWS_SOURCES, type NewsItem, type NewsResponse, type NewsSourceId, type NewsSourceStatus } from "./types";

const TIMEOUT_MS = 8000;
const UA = "GrantOS/1.0 (grant news reader)";

async function get(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...init?.headers }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// ------------------------------------------------------------- normalizing

const DEPARTMENT_CODES: Record<string, string> = {
  USDA: "Department of Agriculture",
  DOC: "Department of Commerce",
  DOD: "Department of Defense",
  ED: "Department of Education",
  DOE: "Department of Energy",
  HHS: "Department of Health and Human Services",
  DHS: "Department of Homeland Security",
  HUD: "Department of Housing and Urban Development",
  DOI: "Department of the Interior",
  DOJ: "Department of Justice",
  DOL: "Department of Labor",
  DOS: "Department of State",
  DOT: "Department of Transportation",
  USDOT: "Department of Transportation",
  TREAS: "Department of the Treasury",
  VA: "Department of Veterans Affairs",
  EPA: "Environmental Protection Agency",
  SBA: "Small Business Administration",
  NSF: "National Science Foundation",
  NASA: "National Aeronautics and Space Administration",
};

/** "Transportation Department" → "Department of Transportation". */
function normalizeDepartment(name?: string | null) {
  if (!name) return undefined;
  const m = name.match(/^(.+) Department$/);
  if (!m) return name;
  return m[1] === "Interior" || m[1] === "Treasury" ? `Department of the ${m[1]}` : `Department of ${m[1]}`;
}

function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'");
}

function plainText(html: string) {
  return decodeEntities(html.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function clip(s: string, max = 320) {
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}…` : s;
}

/** Grants.gov dates come as MM/DD/YYYY. */
function usDate(s?: string) {
  const m = s?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(Date.UTC(+m[3], +m[1] - 1, +m[2], 12)).toISOString() : undefined;
}

// ------------------------------------------------------- Federal Register

interface FrDoc {
  document_number: string;
  title: string;
  abstract: string | null;
  html_url: string;
  publication_date: string;
  agencies: { name?: string; raw_name?: string }[];
}

const FR_FIELDS = ["document_number", "title", "abstract", "html_url", "publication_date", "agencies"];
const FUNDING_TITLE = /funding opportunit|new awards|funding availability|notice of funding|inviting applications|request for applications|grant program|availability of funds|solicitation of applications|\bNOFO\b/i;
const NOISE_TITLE = /information collection|\bOMB\b|paperwork|comment request|membership|advisory committee|recission|rescission/i;
const GRANT_POLICY = /grant|financial assistance|2 CFR|uniform guidance|administrative requirements|cooperative agreement/i;
const NOT_GRANT_POLICY = /Federal Acquisition Regulation|Community Reinvestment/i;

async function federalRegisterQuery(term: string, types: string[]) {
  const params = new URLSearchParams({ "conditions[term]": term, per_page: "100", order: "newest" });
  types.forEach((t) => params.append("conditions[type][]", t));
  FR_FIELDS.forEach((f) => params.append("fields[]", f));
  const res = await get(`https://www.federalregister.gov/api/v1/documents.json?${params}`);
  return ((await res.json()) as { results?: FrDoc[] }).results ?? [];
}

function fromFr(d: FrDoc, kind: NewsItem["kind"]): NewsItem {
  const [dept, office] = d.agencies;
  return {
    id: `fr-${d.document_number}`,
    title: d.title,
    summary: clip(d.abstract ?? ""),
    url: d.html_url,
    source: "federal-register",
    kind,
    agency: normalizeDepartment(dept?.name ?? dept?.raw_name),
    office: office?.name && office.name !== dept?.name ? office.name : undefined,
    publishedAt: new Date(`${d.publication_date}T12:00:00Z`).toISOString(),
  };
}

async function fetchFederalRegister(): Promise<NewsItem[]> {
  "use cache";
  cacheLife("hours");
  const [notices, policy] = await Promise.all([
    federalRegisterQuery('"notice of funding opportunity" | "applications for new awards" | "notice of funding availability" | "inviting applications"', ["NOTICE"]),
    federalRegisterQuery('"uniform administrative requirements" | "2 CFR 200" | "uniform guidance"', ["RULE", "PRORULE"]),
  ]);
  return [
    ...notices.filter((d) => FUNDING_TITLE.test(d.title) && !NOISE_TITLE.test(d.title)).slice(0, 30).map((d) => fromFr(d, "Funding notice")),
    ...policy
      .filter((d) => GRANT_POLICY.test(`${d.title} ${d.abstract ?? ""}`) && !NOT_GRANT_POLICY.test(d.title))
      .slice(0, 8)
      .map((d) => fromFr(d, "Policy & guidance")),
  ];
}

// ------------------------------------------------------------- Grants.gov

interface GgHit {
  id: string;
  number: string;
  title: string;
  agencyCode: string;
  agency: string;
  openDate: string;
  closeDate: string;
  oppStatus: "posted" | "forecasted";
}

async function fetchGrantsGov(): Promise<NewsItem[]> {
  "use cache";
  cacheLife("hours");
  const res = await get("https://api.grants.gov/v1/api/search2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows: 40, oppStatuses: "forecasted|posted", sortBy: "openDate|desc" }),
  });
  const json = (await res.json()) as { errorcode?: number; msg?: string; data?: { oppHits?: GgHit[] } };
  if (json.errorcode) throw new Error(json.msg ?? "Grants.gov API error");
  return (json.data?.oppHits ?? []).map((h) => {
    const dept = DEPARTMENT_CODES[h.agencyCode.split("-")[0]];
    const forecast = h.oppStatus === "forecasted";
    const closes = usDate(h.closeDate);
    return {
      id: `gg-${h.id}`,
      title: h.title,
      summary: [`Opportunity ${h.number}`, h.agency, closes ? `applications close ${h.closeDate}` : forecast ? "forecasted — dates not yet set" : ""].filter(Boolean).join(" · "),
      url: `https://www.grants.gov/search-results-detail/${h.id}`,
      source: "grants-gov" as const,
      kind: forecast ? ("Forecast" as const) : ("New opportunity" as const),
      agency: dept ?? h.agency,
      office: dept ? h.agency : undefined,
      publishedAt: usDate(h.openDate) ?? new Date().toISOString(),
      closeDate: closes,
    };
  });
}

// ---------------------------------------------------- Grants.gov blog (RSS)

function tag(xml: string, name: string) {
  return xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1];
}

async function fetchGrantsGovBlog(): Promise<NewsItem[]> {
  "use cache";
  cacheLife("hours");
  const xml = await (await get("https://grantsgovprod.wordpress.com/feed/")).text();
  return xml
    .split("<item>")
    .slice(1)
    .map((item, i) => {
      const link = plainText(tag(item, "link") ?? "");
      const description = plainText(tag(item, "description") ?? "").replace(/\s*…?\s*Continue reading.*$/i, "…");
      return {
        id: `blog-${plainText(tag(item, "guid") ?? link ?? String(i))}`,
        title: plainText(tag(item, "title") ?? "Untitled"),
        summary: clip(description),
        url: link,
        source: "grants-gov-blog" as const,
        kind: "Grants.gov update" as const,
        agency: "Grants.gov",
        publishedAt: new Date(plainText(tag(item, "pubDate") ?? "")).toISOString(),
      };
    })
    .filter((n) => n.url.startsWith("https://"))
    .slice(0, 15);
}

// --------------------------------------------------------------- combined

const FETCHERS: Record<NewsSourceId, () => Promise<NewsItem[]>> = {
  "federal-register": fetchFederalRegister,
  "grants-gov": fetchGrantsGov,
  "grants-gov-blog": fetchGrantsGovBlog,
};

export async function getGrantNews(): Promise<NewsResponse> {
  const ids = Object.keys(FETCHERS) as NewsSourceId[];
  const settled = await Promise.allSettled(ids.map((id) => FETCHERS[id]()));
  const sources: NewsSourceStatus[] = [];
  const items: NewsItem[] = [];
  settled.forEach((r, i) => {
    const id = ids[i];
    if (r.status === "fulfilled") {
      items.push(...r.value);
      sources.push({ id, label: NEWS_SOURCES[id].label, ok: true, count: r.value.length });
    } else {
      const reason = r.reason instanceof Error ? r.reason.message : "Unavailable";
      sources.push({ id, label: NEWS_SOURCES[id].label, ok: false, count: 0, error: reason.includes("timeout") || reason.includes("aborted") ? "Timed out" : reason });
    }
  });
  const seen = new Set<string>();
  const unique = items.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
  unique.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  return { items: unique, sources, fetchedAt: new Date().toISOString() };
}
