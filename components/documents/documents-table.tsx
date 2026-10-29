"use client";
import Link from "next/link";
import { FileStack } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppData } from "@/lib/data-service";
import type { DocumentItem } from "@/lib/types";
import { cn, daysUntil, formatBytes, formatDate, relativeTime } from "@/lib/utils";
import { FileIcon } from "./file-icon";
import { DocumentRowActions } from "./document-row-actions";

export function DocumentsTable({ docs, showApplication = true }: { docs: DocumentItem[]; showApplication?: boolean }) {
  const data = useAppData();
  if (!docs.length) return <EmptyState icon={FileStack} title="No documents found" description="Try adjusting filters, or upload a new document." className="m-5" />;
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Client</TableHead>
          {showApplication && <TableHead>Application</TableHead>}
          <TableHead>Updated</TableHead>
          <TableHead>Expiration</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((d) => {
          const client = data.clients.find((c) => c.id === d.clientId);
          const app = data.applications.find((a) => a.id === d.applicationId);
          const opp = data.opportunities.find((o) => o.id === app?.opportunityId);
          const exp = d.expiresAt ? daysUntil(d.expiresAt) : null;
          return (
            <TableRow key={d.id}>
              <TableCell>
                <div className="flex min-w-[240px] items-center gap-3">
                  <FileIcon type={d.fileType} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground tabular">
                      {d.sizeBytes ? formatBytes(d.sizeBytes) : "—"} · v{d.version}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-xs font-medium text-slate-600">{d.fileType}</TableCell>
              <TableCell className="whitespace-nowrap text-slate-700">{d.category}</TableCell>
              <TableCell className="whitespace-nowrap">
                {client ? (
                  <Link href={`/clients/${client.id}`} className="hover:text-primary hover:underline">
                    {client.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Firm template</span>
                )}
              </TableCell>
              {showApplication && (
                <TableCell className="max-w-[220px]">
                  {app ? (
                    <Link href={`/applications/${app.id}?tab=documents`} className="block truncate text-slate-700 hover:text-primary hover:underline">
                      {opp?.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              <TableCell className="whitespace-nowrap text-muted-foreground">{relativeTime(d.updatedAt)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {d.expiresAt ? (
                  <span className={cn("text-sm tabular", exp !== null && exp <= 30 ? "font-medium text-amber-600" : "text-slate-600")}>
                    {formatDate(d.expiresAt)}
                    {exp !== null && exp <= 30 && <span className="block text-[11px]">{exp < 0 ? "Expired" : `in ${exp} days`}</span>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <DocumentStatusBadge status={d.status} />
              </TableCell>
              <TableCell>
                <DocumentRowActions doc={d} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
