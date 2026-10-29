"use client";
import { useMemo, useRef, useState } from "react";
import { FileUp, Info, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addDocuments, useAppData } from "@/lib/data-service";
import type { DocumentCategory } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "Capability Statement",
  "Organization Chart",
  "Resume",
  "Financial Statement",
  "Budget",
  "Past Performance",
  "Letter of Support",
  "Policy",
  "Certification",
  "Narrative",
  "Federal Form",
  "Template",
  "Other",
];

interface Picked {
  name: string;
  type: string;
  size: number;
}

export function UploadDocumentsDialog({ clientId, applicationId, trigger }: { clientId?: string; applicationId?: string; trigger?: React.ReactNode }) {
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<Picked[]>([]);
  const [drag, setDrag] = useState(false);
  const presetClient = clientId ?? data.applications.find((a) => a.id === applicationId)?.clientId ?? "";
  const [client, setClient] = useState(presetClient);
  const [app, setApp] = useState(applicationId ?? "");
  const [category, setCategory] = useState<DocumentCategory>("Other");
  const inputRef = useRef<HTMLInputElement>(null);

  const apps = useMemo(() => data.applications.filter((a) => !client || a.clientId === client), [data.applications, client]);
  const oppTitle = (id: string) => data.opportunities.find((o) => o.id === id)?.title ?? "Application";

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list).map((f) => ({ name: f.name, type: f.name.split(".").pop()?.toUpperCase() ?? "FILE", size: f.size }))]);
  };

  const reset = () => {
    setFiles([]);
    setClient(presetClient);
    setApp(applicationId ?? "");
    setCategory("Other");
  };

  const save = () => {
    addDocuments(
      files.map((f) => ({ name: f.name, sizeBytes: f.size })),
      { clientId: client || undefined, applicationId: app || undefined, category, scope: category === "Template" && !client ? "template" : app ? "application" : client ? "client" : "template" },
    );
    toast.success(`${files.length} document${files.length === 1 ? "" : "s"} uploaded`, { description: "File details saved to the document vault." });
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Upload /> Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>Add files to the document vault and link them to a client or application.</DialogDescription>
        </DialogHeader>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          className={cn("flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors", drag ? "border-primary bg-primary-soft" : "border-input bg-muted/40 hover:bg-muted")}
        >
          <FileUp className="mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Drop files here or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, XLSX up to 25 MB each</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </div>
        {files.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{f.type}</span>
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground tabular">{formatBytes(f.size)}</span>
                <button aria-label={`Remove ${f.name}`} className="rounded p-0.5 text-muted-foreground hover:bg-muted" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={client} disabled={!!clientId} onChange={(e) => { setClient(e.target.value); setApp(""); }}>
              <option value="">No client (template)</option>
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Application</Label>
            <Select value={app} onChange={(e) => setApp(e.target.value)} disabled={!!applicationId}>
              <option value="">Not linked</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>{oppTitle(a.opportunityId)}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" /> Files stay on your device in this demo — only file details are saved.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={!files.length}>
            <Upload /> Upload {files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
