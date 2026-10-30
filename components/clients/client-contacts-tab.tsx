"use client";
import { useState } from "react";
import { Mail, Phone, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/shared/avatar";
import { addContact, useAppData } from "@/lib/data-service";
import type { Client, Contact } from "@/lib/types";

const ROLES: Contact["role"][] = ["Primary Contact", "Executive Sponsor", "Finance", "Program Lead", "Signatory"];

export function ClientContactsTab({ client }: { client: Client }) {
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const contacts = data.contacts.filter((c) => c.clientId === client.id).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{contacts.length} contacts</p>
        <Button onClick={() => setOpen(true)}>
          <Plus /> Add Contact
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {contacts.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar name={c.name} color={c.isPrimary ? "bg-primary" : "bg-slate-500"} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold">{c.name}</span>
                  {c.isPrimary && <Star className="size-3.5 fill-amber-400 text-amber-400" aria-label="Primary contact" />}
                </div>
                <div className="truncate text-xs text-muted-foreground">{c.title}</div>
                <Badge variant="secondary" className="mt-1.5">
                  {c.role}
                </Badge>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 truncate text-primary hover:underline">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" /> {c.email}
              </a>
              <div className="flex items-center gap-2 tabular text-slate-700">
                <Phone className="size-3.5 text-muted-foreground" /> {c.phone || "—"}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">{open && <ContactForm clientId={client.id} onDone={() => setOpen(false)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function ContactForm({ clientId, onDone }: { clientId: string; onDone: () => void }) {
  const [f, setF] = useState({ name: "", title: "", email: "", phone: "", role: "Program Lead" as Contact["role"], isPrimary: false });
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
          setError("Name and a valid email are required.");
          return;
        }
        addContact({ clientId, ...f, name: f.name.trim(), email: f.email.trim() });
        toast.success("Contact added", { description: f.name });
        onDone();
      }}
    >
      <DialogHeader>
        <DialogTitle>Add contact</DialogTitle>
        <DialogDescription>Client stakeholders for approvals, documents, and signatures.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ct-name">Name *</Label>
          <Input id="ct-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-title">Title</Label>
          <Input id="ct-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-role">Role</Label>
          <Select id="ct-role" value={f.role} onValueChange={(v) => setF({ ...f, role: v as Contact["role"] })}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-email">Email *</Label>
          <Input id="ct-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-phone">Phone</Label>
          <Input id="ct-phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox checked={f.isPrimary} onCheckedChange={(v) => setF({ ...f, isPrimary: v === true })} /> Set as primary contact
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Add contact</Button>
      </DialogFooter>
    </form>
  );
}
