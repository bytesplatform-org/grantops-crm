"use client";
import Link from "next/link";
import { FileQuestion, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/shared/status-badge";
import { UploadDocumentsDialog } from "@/components/documents/upload-dialog";
import { RequestDocumentsDialog } from "@/components/documents/request-documents-dialog";
import { useAppData } from "@/lib/data-service";
import type { Client, DocumentCategory, DocumentItem } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

const GROUPS: { category: DocumentCategory; label: string }[] = [
  { category: "Capability Statement", label: "Capability Statement" },
  { category: "Organization Chart", label: "Organization Chart" },
  { category: "Resume", label: "Resumes" },
  { category: "Financial Statement", label: "Financial Statements" },
  { category: "Past Performance", label: "Past Performance" },
  { category: "Letter of Support", label: "Letters of Support" },
  { category: "Policy", label: "Policies" },
  { category: "Certification", label: "Certifications" },
];

function DocRow({ doc, appTitle }: { doc: DocumentItem; appTitle?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-[9px] font-bold text-slate-600">{doc.fileType}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{doc.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {doc.sizeBytes ? formatBytes(doc.sizeBytes) : "Awaiting upload"} · Updated {formatDate(doc.updatedAt)}
          {doc.expiresAt && ` · Expires ${formatDate(doc.expiresAt)}`}
          {appTitle && ` · ${appTitle}`}
        </div>
      </div>
      <DocumentStatusBadge status={doc.status} />
    </div>
  );
}

export function ClientDocumentsTab({ client, requestAppId }: { client: Client; requestAppId?: string }) {
  const data = useAppData();
  const docs = data.documents.filter((d) => d.clientId === client.id);
  const appTitle = (id?: string) => data.opportunities.find((o) => o.id === data.applications.find((a) => a.id === id)?.opportunityId)?.title;
  const grouped = new Set(GROUPS.map((g) => g.category));
  const other = docs.filter((d) => !grouped.has(d.category));
  const onFile = GROUPS.filter((g) => docs.some((d) => d.category === g.category)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {docs.length} documents on file · {onFile} of {GROUPS.length} core categories covered
        </p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/documents?q=${encodeURIComponent(client.name.split(" ")[0])}`}>Open in vault</Link>
          </Button>
          <UploadDocumentsDialog
            clientId={client.id}
            trigger={
              <Button>
                <Upload /> Upload
              </Button>
            }
          />
        </div>
      </div>
      <Card className="divide-y divide-border">
        {GROUPS.map((g) => {
          const items = docs.filter((d) => d.category === g.category);
          return (
            <div key={g.category}>
              <div className="flex items-center justify-between bg-muted/40 px-5 py-2">
                <span className="text-[13px] font-medium text-muted-foreground">{g.label}</span>
                <span className="text-[11px] text-muted-foreground tabular">{items.length}</span>
              </div>
              {items.length ? (
                items.map((d) => <DocRow key={d.id} doc={d} appTitle={appTitle(d.applicationId)} />)
              ) : (
                <div className="flex items-center gap-3 px-5 py-2.5">
                  <span className="flex size-8 items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-400">
                    <FileQuestion className="size-4" />
                  </span>
                  <span className="flex-1 text-sm text-muted-foreground">Not on file</span>
                  <RequestDocumentsDialog
                    applicationId={requestAppId}
                    trigger={
                      <Button size="xs" variant="outline">
                        Request
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </Card>
      {other.length > 0 && (
        <Card className="divide-y divide-border">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" /> Other client documents
              </CardTitle>
              <CardDescription>Budgets, narratives, and supporting attachments.</CardDescription>
            </div>
          </CardHeader>
          {other.map((d) => (
            <DocRow key={d.id} doc={d} appTitle={appTitle(d.applicationId)} />
          ))}
        </Card>
      )}
    </div>
  );
}
