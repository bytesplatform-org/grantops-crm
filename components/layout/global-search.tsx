"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, FileText, FolderKanban, Landmark, Search, UserPlus } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useAppData } from "@/lib/store";
import { cn, formatCompactCurrency } from "@/lib/utils";

interface Result {
  id: string;
  group: "Clients" | "Applications" | "Opportunities" | "Documents" | "Leads";
  title: string;
  subtitle: string;
  href: string;
}

const GROUP_ICON = { Clients: Briefcase, Applications: FolderKanban, Opportunities: Landmark, Documents: FileText, Leads: UserPlus } as const;

export function GlobalSearch() {
  const data = useAppData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const has = (s?: string) => !!s && s.toLowerCase().includes(term);
    const clients = data.clients.filter((c) => has(c.name) || has(c.industry) || has(c.state) || c.naics.some(has));
    const clientIds = new Set(clients.map((c) => c.id));
    const oppTitle = (id: string) => data.opportunities.find((o) => o.id === id)?.title ?? "";
    const clientName = (id?: string) => data.clients.find((c) => c.id === id)?.name ?? "";
    const out: Result[] = [];
    clients.forEach((c) => out.push({ id: c.id, group: "Clients", title: c.name, subtitle: `${c.organizationType} · ${c.city}, ${c.state}`, href: `/clients/${c.id}` }));
    data.applications
      .filter((a) => clientIds.has(a.clientId) || has(oppTitle(a.opportunityId)))
      .forEach((a) => out.push({ id: a.id, group: "Applications", title: oppTitle(a.opportunityId), subtitle: `${clientName(a.clientId)} · ${a.status} · ${formatCompactCurrency(a.fundingRequested)}`, href: `/applications/${a.id}` }));
    const relatedOpp = new Set(data.matches.filter((m) => clientIds.has(m.clientId) && m.status !== "Dismissed").map((m) => m.opportunityId));
    data.opportunities
      .filter((o) => relatedOpp.has(o.id) || has(o.title) || has(o.agency) || has(o.opportunityNumber) || has(o.category))
      .forEach((o) => out.push({ id: o.id, group: "Opportunities", title: o.title, subtitle: `${o.agency} · ${o.opportunityNumber}`, href: `/opportunities/${o.id}` }));
    data.documents
      .filter((d) => has(d.name) || (d.clientId && clientIds.has(d.clientId)))
      .slice(0, 8)
      .forEach((d) => out.push({ id: d.id, group: "Documents", title: d.name, subtitle: `${d.category}${d.clientId ? ` · ${clientName(d.clientId)}` : ""}`, href: `/documents?q=${encodeURIComponent(d.name)}` }));
    data.leads
      .filter((l) => has(l.company) || has(l.contactName))
      .forEach((l) => out.push({ id: l.id, group: "Leads", title: l.company, subtitle: `${l.stage} · ${l.contactName}`, href: `/leads?lead=${l.id}` }));
    return out.slice(0, 30);
  }, [q, data]);

  const go = (r: Result) => {
    setOpen(false);
    setQ("");
    router.push(r.href);
  };

  const groups = (["Clients", "Applications", "Opportunities", "Documents", "Leads"] as const).map((g) => ({ g, items: results.filter((r) => r.group === g) })).filter((x) => x.items.length);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <DialogPrimitive.Trigger asChild>
        <button aria-label="Search" className="flex h-10 w-10 items-center justify-center gap-2.5 rounded-xl border border-border bg-zinc-50 text-sm text-muted-foreground transition-colors hover:bg-zinc-100 md:w-full md:justify-start md:px-4">
          <Search className="size-[18px]" />
          <span className="hidden flex-1 truncate text-left md:block">Search clients, grants, applications…</span>
          <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[10px] font-medium md:inline">⌘K</kbd>
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 data-[state=open]:animate-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl data-[state=open]:animate-in">
          <DialogPrimitive.Title className="sr-only">Global search</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === "Enter" && results[active]) go(results[active]);
              }}
              placeholder="Search across clients, opportunities, applications and documents…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            {!q.trim() && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Try <button className="font-medium text-primary hover:underline" onClick={() => setQ("Horizon")}>Horizon</button>,{" "}
                <button className="font-medium text-primary hover:underline" onClick={() => setQ("DOE")}>DOE</button>, or{" "}
                <button className="font-medium text-primary hover:underline" onClick={() => setQ("Letter of Support")}>Letter of Support</button>
              </div>
            )}
            {q.trim() && results.length === 0 && <div className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{q}”.</div>}
            {groups.map(({ g, items }) => {
              const Icon = GROUP_ICON[g];
              return (
                <div key={g} className="mb-1">
                  <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{g}</div>
                  {items.map((r) => {
                    const idx = results.indexOf(r);
                    return (
                      <button
                        key={r.group + r.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(r)}
                        className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left", idx === active ? "bg-muted" : "hover:bg-muted/60")}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{r.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
