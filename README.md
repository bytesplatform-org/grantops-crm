# GrantOS — Grant Operations & Client Management Platform (Demo)

A frontend-only demo CRM for a grant-writing / federal funding consultancy. It covers the full
workflow: **Lead → Client → Funding Profile → Grant Discovery → Matching → NOFO Analysis →
Go/No-Go → Application Workspace → Writing → Documents → Compliance → Ready to Submit →
Grants.gov handoff → Outcome**.

> Demo workspace. All opportunities are fictional sample data (`isDemo: true`). GrantOS tracks
> preparation and handoff; official submission happens through Grants.gov Workspace.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000  — sign in with demo@grantos.local / any password
```

Production build: `npm run build && npm start`. Deploys to Vercel with zero configuration.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn-style components on Radix UI · Lucide icons · Recharts · Sonner toasts.

## Data & persistence

| File | Purpose |
| --- | --- |
| `lib/types.ts` | Domain types (Lead, Client, Opportunity, GrantMatch, Application, NOFOAnalysis, …) |
| `lib/mock/*`, `lib/mock-data.ts` | Seed data, generated relative to "today" on first load |
| `lib/storage.ts` | Error-safe localStorage helpers + fake demo session |
| `lib/store.ts` | External store (`useAppData`) persisted under `grantos_demo_v1` |
| `lib/data-service.ts` | **Service layer** — every read/write the UI performs |
| `lib/ai-service.ts` | Simulated AI (NOFO analysis, drafting, improve, shorten, requirement check) |
| `lib/matching.ts` | Explainable client ↔ opportunity scoring and Go/No-Go rules |
| `lib/selectors.ts` | Derived data (budget totals, completion %, KPIs) |

To connect a backend, replace the function bodies in `lib/data-service.ts` and `lib/ai-service.ts`
with API calls; components only depend on those signatures.

Reset everything from **Settings → Demo Data → Reset Demo Workspace** (or the profile menu).

## Grant News (live data)

`/news` is the one module that reads live public data. Everything else is sample data.

| File | Purpose |
| --- | --- |
| `app/api/news/route.ts` | `GET /api/news` — runs per request, returns normalized `NewsItem`s plus per-source status |
| `lib/news/sources.ts` | Source adapters, each cached for an hour with `"use cache"` + `cacheLife("hours")` |
| `lib/news/types.ts` | Shared `NewsItem` / `NewsResponse` types and source labels |
| `components/news/relevance.ts` | Tags items with clients whose multi-word keywords or preferred agencies match |

Sources (no API keys needed):

- **Federal Register API** — funding notices (NOFOs, "applications for new awards") and grant-program rules, filtered by title to drop paperwork notices.
- **Grants.gov `search2` API** — newest posted and forecasted opportunities.
- **Grants.gov Community Blog RSS** — Grants.gov system and policy updates.

A source that fails is not cached; the page shows the others and names the one that's down.
To add a source, write a fetcher returning `NewsItem[]` in `lib/news/sources.ts` and register it in `FETCHERS`.

## Suggested demo path

1. Clients → **Horizon Fleet Services** → Funding Profile
2. **Find Funding** → Clean Transportation Infrastructure Program (86% potential match)
3. Opportunity → **NOFO Analysis → Run Analysis**
4. Matches → review breakdown → **Start Application** → score Go/No-Go → **Approve Pursuit**
5. Application → **Writing Workspace** → Generate Draft / Check Requirement
6. Requirements (compliance matrix), Documents → **Request Documents**
7. Budget builder (see the Horizon DOE application: $475,000 federal / $118,750 match / 20%)
8. Reviews → resolve comments → Submission → **Open Grants.gov Workspace** → Mark Submitted → Record Outcome

## Brand

The product name lives in `components/layout/nav.ts` (`BRAND`) and `app/layout.tsx` metadata.
