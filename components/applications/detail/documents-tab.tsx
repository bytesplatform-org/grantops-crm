"use client";
import { CheckCircle2, FileText, Mail, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentStatusBadge } from "@/components/shared/status-badge";
import { UploadDocumentsDialog } from "@/components/documents/upload-dialog";
import { RequestDocumentsDialog } from "@/components/documents/request-documents-dialog";
import { markDocumentReceived, markRequestItemReceived, sendDocumentRequest } from "@/lib/data-service";
import { formatBytes, formatDate, relativeTime } from "@/lib/utils";
import { ComplianceMatrix } from "./compliance-matrix";
import type { AppContext } from "./use-application";

export function DocumentsTab({ ctx }: { ctx: AppContext }) {
  const { app, data } = ctx;
  const docs = data.documents.filter((d) => d.applicationId === app.id);
  const requests = data.documentRequests.filter((r) => r.applicationId === app.id);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-[15px] font-medium">Compliance matrix</h2>
        <ComplianceMatrix ctx={ctx} />
      </section>
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Application documents</CardTitle>
            <CardDescription>{docs.length} files linked to this application</CardDescription>
          </div>
          <div className="flex gap-2">
            <UploadDocumentsDialog
              clientId={app.clientId}
              applicationId={app.id}
              trigger={<Button size="sm" variant="outline"><Upload /> Upload</Button>}
            />
            <RequestDocumentsDialog applicationId={app.id} trigger={<Button size="sm"><Mail /> Request Documents</Button>} />
          </div>
        </CardHeader>
        {docs.length === 0 ? (
          <CardContent>
            <EmptyState icon={FileText} title="No documents yet" description="Upload files or request them from the client." />
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{d.name}</span>
                    </div>
                    <div className="pl-6 text-[11px] text-muted-foreground">{d.sizeBytes ? formatBytes(d.sizeBytes) : "Awaiting upload"} · v{d.version}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{d.fileType}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{d.category}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(d.updatedAt)}</TableCell>
                  <TableCell><DocumentStatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-right">
                    {(d.status === "Requested" || d.status === "Overdue") && (
                      <Button size="xs" variant="outline" onClick={() => { markDocumentReceived(d.id); toast.success(`${d.name} marked received`); }}>
                        <CheckCircle2 /> Mark received
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Document requests</CardTitle>
            <CardDescription>Requests sent to the client for this application</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[13px] font-medium">
                  {r.items.length} item{r.items.length > 1 ? "s" : ""} · due {formatDate(r.dueDate)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === "Received" ? "success" : r.status === "Overdue" ? "danger" : r.status === "Draft" ? "outline" : "info"} dot>{r.status}</Badge>
                  {r.status === "Draft" && (
                    <Button size="xs" onClick={() => { sendDocumentRequest(r.id); toast.success("Request sent to client"); }}>
                      <Send /> Send
                    </Button>
                  )}
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {r.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className={it.status === "Received" ? "text-muted-foreground line-through" : ""}>{it.name}</span>
                    {it.status === "Received" ? (
                      <Badge variant="success">Received</Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Badge variant={it.status === "Overdue" ? "danger" : "secondary"}>{it.status}</Badge>
                        {r.status !== "Draft" && (
                          <Button size="xs" variant="ghost" onClick={() => { markRequestItemReceived(r.id, it.id); toast.success(`${it.name} received`); }}>
                            Mark received
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {r.sentAt && <div className="mt-2 text-[11px] text-muted-foreground">Sent {relativeTime(r.sentAt)}</div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
