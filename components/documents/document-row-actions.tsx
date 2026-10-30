"use client";
import { useRef, useState } from "react";
import { CheckCircle2, Link2, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { attachDocument, deleteDocument, markDocumentReceived, replaceDocument, useAppData } from "@/lib/data-service";
import type { DocumentItem } from "@/lib/types";

export function DocumentRowActions({ doc }: { doc: DocumentItem }) {
  const data = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target, setTarget] = useState(doc.applicationId ?? "");
  const apps = data.applications.filter((a) => !doc.clientId || a.clientId === doc.clientId);
  const pending = doc.status === "Requested" || doc.status === "Overdue" || doc.status === "Draft";

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            replaceDocument(doc.id, { name: f.name, sizeBytes: f.size });
            toast.success("Document replaced", { description: `${f.name} saved as v${doc.version + 1}.` });
          }
          e.target.value = "";
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${doc.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            disabled={!pending}
            onSelect={() => {
              markDocumentReceived(doc.id);
              toast.success("Marked as received", { description: doc.name });
            }}
          >
            <CheckCircle2 /> Mark received
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            <RefreshCw /> Replace file…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAttachOpen(true)}>
            <Link2 /> Attach to application…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attach to application</DialogTitle>
            <DialogDescription>{doc.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Application</Label>
            <Select value={target} onValueChange={setTarget}>
              <option value="">Select an application…</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {data.opportunities.find((o) => o.id === a.opportunityId)?.title} — {data.clients.find((c) => c.id === a.clientId)?.name}
                </option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachOpen(false)}>Cancel</Button>
            <Button
              disabled={!target}
              onClick={() => {
                attachDocument(doc.id, target);
                toast.success("Document attached to application");
                setAttachOpen(false);
              }}
            >
              Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>{doc.name} will be removed from the vault. This can be restored only by resetting demo data.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteDocument(doc.id);
                toast.success("Document deleted");
                setDeleteOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
