"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { useAppData } from "@/lib/data-service";
import type { DocumentScope, DocumentStatus } from "@/lib/types";
import { cn, daysUntil } from "@/lib/utils";
import { DocumentsTable } from "./documents-table";
import { RequestsList } from "./requests-list";
import { DOCUMENT_CATEGORIES, UploadDocumentsDialog } from "./upload-dialog";
import { RequestDocumentsDialog } from "./request-documents-dialog";

const TABS = ["client", "application", "templates", "requests"] as const;
type Tab = (typeof TABS)[number];
const SCOPE: Record<Exclude<Tab, "requests">, DocumentScope> = { client: "client", application: "application", templates: "template" };
const STATUSES: DocumentStatus[] = ["Received", "Approved", "Requested", "Overdue", "Expiring", "Draft"];

export function DocumentsView() {
  const data = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initialTab = (TABS as readonly string[]).includes(params.get("tab") ?? "") ? (params.get("tab") as Tab) : "client";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [client, setClient] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  // If a search came from global search, open the tab containing the document.
  const [autoTabbed, setAutoTabbed] = useState(false);
  if (!autoTabbed && params.get("q") && !params.get("tab")) {
    const hit = data.documents.find((d) => d.name.toLowerCase().includes((params.get("q") ?? "").toLowerCase()));
    if (hit) setTab(hit.scope === "template" ? "templates" : hit.scope);
    setAutoTabbed(true);
  }

  const changeTab = (t: string) => {
    setTab(t as Tab);
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", t);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.documents.filter(
      (d) =>
        (!term || d.name.toLowerCase().includes(term) || d.category.toLowerCase().includes(term)) &&
        (!client || d.clientId === client) &&
        (!category || d.category === category) &&
        (!status || d.status === status),
    );
  }, [data.documents, q, client, category, status]);

  const counts = useMemo(() => {
    const docs = data.documents;
    return {
      total: docs.length,
      received: docs.filter((d) => d.status === "Received" || d.status === "Approved").length,
      requested: docs.filter((d) => d.status === "Requested").length,
      overdue: docs.filter((d) => d.status === "Overdue").length,
      expiring: docs.filter((d) => d.status === "Expiring" || (d.expiresAt && daysUntil(d.expiresAt) <= 30)).length,
    };
  }, [data.documents]);

  const openRequests = data.documentRequests.filter((r) => r.status !== "Received").length;
  const tabCount = (t: Exclude<Tab, "requests">) => filtered.filter((d) => d.scope === SCOPE[t]).length;

  const chips = [
    { label: "Total documents", value: counts.total, cls: "text-foreground" },
    { label: "Received / approved", value: counts.received, cls: "text-emerald-600" },
    { label: "Requested", value: counts.requested, cls: "text-slate-700" },
    { label: "Overdue", value: counts.overdue, cls: "text-red-600" },
    { label: "Expiring ≤ 30 days", value: counts.expiring, cls: "text-amber-600" },
  ];

  return (
    <>
      <PageHeader
        title="Documents"
        description="Reusable document vault for client records, application attachments, and firm templates."
        actions={
          <>
            <UploadDocumentsDialog />
            <RequestDocumentsDialog />
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {chips.map((c) => (
          <Card key={c.label} className="px-4 py-3">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className={cn("mt-1 text-xl font-semibold tabular", c.cls)}>{c.value}</div>
          </Card>
        ))}
      </div>
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="client">Client Documents <Count n={tabCount("client")} /></TabsTrigger>
          <TabsTrigger value="application">Application Documents <Count n={tabCount("application")} /></TabsTrigger>
          <TabsTrigger value="templates">Templates <Count n={tabCount("templates")} /></TabsTrigger>
          <TabsTrigger value="requests">Requests <Count n={openRequests} /></TabsTrigger>
        </TabsList>
        {tab !== "requests" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…" className="pl-8" />
            </div>
            <Select value={client} onChange={(e) => setClient(e.target.value)} className="w-48" aria-label="Filter by client">
              <option value="">All clients</option>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44" aria-label="Filter by category">
              <option value="">All categories</option>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" aria-label="Filter by status">
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
        )}
        {(["client", "application", "templates"] as const).map((t) => (
          <TabsContent key={t} value={t} className="pt-4">
            <Card className="overflow-hidden">
              <DocumentsTable docs={filtered.filter((d) => d.scope === SCOPE[t])} showApplication={t !== "templates"} />
            </Card>
          </TabsContent>
        ))}
        <TabsContent value="requests" className="pt-4">
          <RequestsList requests={[...data.documentRequests].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Count({ n }: { n: number }) {
  return <span className="rounded bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground tabular">{n}</span>;
}
