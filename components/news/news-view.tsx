"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, FileText, Landmark, Megaphone, Newspaper, RefreshCw, Scale, Search, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppData } from "@/lib/data-service";
import { NEWS_SOURCES, type NewsItem, type NewsKind, type NewsResponse, type NewsSourceId } from "@/lib/news/types";
import { cn, formatShortDate, relativeTime } from "@/lib/utils";
import { relevantClients, type ClientRelevance } from "./relevance";

const KINDS: NewsKind[] = ["Funding notice", "New opportunity", "Forecast", "Policy & guidance", "Grants.gov update"];

const KIND_STYLE: Record<NewsKind, { icon: LucideIcon; chip: string }> = {
  "Funding notice": { icon: Megaphone, chip: "bg-brand text-zinc-900" },
  "New opportunity": { icon: Sparkles, chip: "bg-emerald-50 text-emerald-700" },
  Forecast: { icon: FileText, chip: "bg-sky-50 text-sky-700" },
  "Policy & guidance": { icon: Scale, chip: "bg-violet-50 text-violet-700" },
  "Grants.gov update": { icon: Landmark, chip: "bg-zinc-100 text-zinc-700" },
};

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: NewsResponse };

export function NewsView() {
  const data = useAppData();
  const [state, setState] = useState<State>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<NewsKind | "all">("all");
  const [source, setSource] = useState<NewsSourceId | "all">("all");
  const [clientId, setClientId] = useState("all");
  const [relevantOnly, setRelevantOnly] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      const json = (await res.json()) as NewsResponse;
      if (!json.sources?.some((s) => s.ok)) throw new Error("None of the news sources responded.");
      setState({ status: "ready", data: json });
    } catch (e) {
      setState((s) => (s.status === "ready" ? s : { status: "error", message: e instanceof Error ? e.message : "Could not load news." }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => (state.status === "ready" ? state.data.items : []), [state]);
  const withRelevance = useMemo(() => items.map((item) => ({ item, rel: relevantClients(item, data.clients) })), [items, data.clients]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return withRelevance.filter(({ item, rel }) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (source !== "all" && item.source !== source) return false;
      if (relevantOnly && !rel.some((r) => r.strong)) return false;
      if (clientId !== "all" && !rel.some((r) => r.client.id === clientId)) return false;
      if (needle && !`${item.title} ${item.summary} ${item.agency ?? ""} ${item.office ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [withRelevance, q, kind, source, relevantOnly, clientId]);

  const stats = useMemo(() => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      notices: items.filter((n) => n.kind === "Funding notice").length,
      noticesRecent: items.filter((n) => n.kind === "Funding notice" && +new Date(n.publishedAt) >= monthAgo).length,
      newOpps: items.filter((n) => n.kind === "New opportunity" || n.kind === "Forecast").length,
      relevant: withRelevance.filter((x) => x.rel.some((r) => r.strong)).length,
    };
  }, [items, withRelevance]);

  const activeClients = data.clients.filter((c) => c.status === "Active" || c.status === "Onboarding");
  const sources = state.status === "ready" ? state.data.sources : [];
  const down = sources.filter((s) => !s.ok);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grant News"
        description="Funding notices, new opportunities and Grants.gov updates from official federal sources."
        actions={
          <Button
            variant="outline"
            disabled={refreshing || state.status === "loading"}
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
          >
            <RefreshCw className={cn(refreshing && "animate-spin")} /> Refresh
          </Button>
        }
      />

      {state.status === "loading" && <NewsSkeleton />}

      {state.status === "error" && (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="News is unavailable right now"
            description={`${state.message} The sources may be down or this device may be offline.`}
            action={
              <Button
                onClick={() => {
                  setState({ status: "loading" });
                  void load();
                }}
              >
                <RefreshCw /> Try again
              </Button>
            }
          />
        </Card>
      )}

      {state.status === "ready" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard highlight label="Funding notices" value={stats.notices} hint={`${stats.noticesRecent} published in the last 30 days`} />
            <StatCard label="New & forecasted opportunities" value={stats.newOpps} icon={Sparkles} hint="Latest Grants.gov postings" />
            <StatCard label="Relevant to your clients" value={stats.relevant} icon={Newspaper} hint="Keyword or interest match" />
            <StatCard
              label="Sources online"
              value={`${sources.filter((s) => s.ok).length}/${sources.length}`}
              icon={Landmark}
              iconTone={down.length ? "rose" : "brand"}
              hint={`Updated ${relativeTime(state.data.fetchedAt)}`}
            />
          </div>

          {down.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-800">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {down.map((s) => `${s.label} (${s.error ?? "unavailable"})`).join(", ")} could not be reached. Showing news from the other sources.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search headlines, agencies…" className="h-9 pl-9" />
            </div>
            <Select aria-label="Type" value={kind} onValueChange={(v) => setKind(v as NewsKind | "all")} className="h-9 w-auto">
              <option value="all">All types</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
            <Select aria-label="Source" value={source} onValueChange={(v) => setSource(v as NewsSourceId | "all")} className="h-9 w-auto">
              <option value="all">All sources</option>
              {(Object.keys(NEWS_SOURCES) as NewsSourceId[]).map((id) => (
                <option key={id} value={id}>
                  {NEWS_SOURCES[id].label}
                </option>
              ))}
            </Select>
            <Select aria-label="Client" value={clientId} onValueChange={setClientId} className="h-9 w-auto max-w-[220px]">
              <option value="all">Any client</option>
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <label className="flex h-9 items-center gap-2 rounded-[10px] border border-border px-3 text-[13px]">
              <Switch checked={relevantOnly} onCheckedChange={setRelevantOnly} aria-label="Only news relevant to my clients" />
              Relevant to my clients
            </label>
          </div>

          <div className="text-[13px] text-muted-foreground">
            {filtered.length} article{filtered.length === 1 ? "" : "s"}
          </div>

          {filtered.length ? (
            <div className="space-y-3">
              {filtered.map(({ item, rel }) => (
                <NewsCard key={item.id} item={item} rel={rel} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState icon={Newspaper} title="No news matches these filters" description="Try a different type, source or search term." />
            </Card>
          )}

          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Headlines and summaries come from{" "}
            {(Object.keys(NEWS_SOURCES) as NewsSourceId[]).map((id, i, all) => (
              <span key={id}>
                <a href={NEWS_SOURCES[id].home} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {NEWS_SOURCES[id].label}
                </a>
                {i < all.length - 2 ? ", " : i === all.length - 2 ? " and " : ""}
              </span>
            ))}
            , refreshed about hourly. Client relevance is a keyword match, not an eligibility determination — confirm details in the original notice.
          </p>
        </>
      )}
    </div>
  );
}

function NewsCard({ item, rel }: { item: NewsItem; rel: ClientRelevance[] }) {
  const k = KIND_STYLE[item.kind];
  return (
    <Card className="p-5 transition-colors hover:border-zinc-300">
      <div className="flex gap-4">
        <span className={cn("hidden size-10 shrink-0 items-center justify-center rounded-full sm:flex", k.chip)}>
          <k.icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
            <span className={cn("rounded-md px-1.5 py-0.5 font-medium", k.chip)}>{item.kind}</span>
            <span>{NEWS_SOURCES[item.source].label}</span>
            {item.agency && item.source !== "grants-gov-blog" && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="truncate">{item.agency}</span>
              </>
            )}
            <span className="text-zinc-300">·</span>
            <time dateTime={item.publishedAt} title={new Date(item.publishedAt).toLocaleString()}>
              {relativeTime(item.publishedAt)}
            </time>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-1.5 flex items-start gap-1.5 text-[15px] font-semibold leading-snug tracking-tight text-foreground hover:underline"
          >
            <span>{item.title}</span>
            <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
          {item.summary && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-600">{item.summary}</p>}
          {(rel.length > 0 || item.closeDate) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {item.closeDate && (
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[12px] font-medium text-zinc-700">Closes {formatShortDate(item.closeDate)}</span>
              )}
              {rel.slice(0, 3).map((r) => (
                <Link
                  key={r.client.id}
                  href={`/clients/${r.client.id}`}
                  title={r.reason}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors",
                    r.strong ? "bg-dark text-white hover:bg-[#2e323a]" : "border border-border text-zinc-600 hover:bg-zinc-50",
                  )}
                >
                  {r.client.name}
                </Link>
              ))}
              {rel.length > 3 && <span className="text-[12px] text-muted-foreground">+{rel.length - 3} more</span>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function NewsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading news">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-9 rounded-[10px]" />
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[112px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
