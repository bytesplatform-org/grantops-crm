"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addClient, updateClient } from "@/lib/data-service";
import type { Client, ClientStatus, OrganizationType } from "@/lib/types";
import { ORG_TYPES, splitList } from "@/components/leads/constants";

const STATUSES: ClientStatus[] = ["Active", "Onboarding", "Paused", "Inactive"];

interface FormState {
  name: string;
  organizationType: OrganizationType;
  industry: string;
  city: string;
  state: string;
  naics: string;
  serviceArea: string;
  fundingInterests: string;
  certifications: string;
  status: ClientStatus;
  potentialFunding: string;
  summary: string;
  website: string;
  employees: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
}

function initial(c?: Client): FormState {
  return {
    name: c?.name ?? "",
    organizationType: c?.organizationType ?? "Small Business",
    industry: c?.industry ?? "",
    city: c?.city ?? "",
    state: c?.state ?? "",
    naics: c?.naics.join(", ") ?? "",
    serviceArea: c?.serviceArea ?? "",
    fundingInterests: c?.fundingInterests.join(", ") ?? "",
    certifications: c?.certifications.join(", ") ?? "",
    status: c?.status ?? "Onboarding",
    potentialFunding: c ? String(c.potentialFunding) : "",
    summary: c?.summary ?? "",
    website: c?.website ?? "",
    employees: c ? String(c.employees) : "",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
  };
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client?: Client;
  onCreated?: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {open && <ClientForm key={client?.id ?? "new"} client={client} onDone={() => onOpenChange(false)} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  );
}

function ClientForm({ client, onDone, onCreated }: { client?: Client; onDone: () => void; onCreated?: (id: string) => void }) {
  const [form, setForm] = useState<FormState>(() => initial(client));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Company name is required";
    if (!form.industry.trim()) errs.industry = "Industry is required";
    if (!client && !form.contactName.trim()) errs.contactName = "Primary contact is required";
    if (!client && form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errs.contactEmail = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const base = {
      name: form.name.trim(),
      organizationType: form.organizationType,
      industry: form.industry.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      naics: splitList(form.naics),
      serviceArea: form.serviceArea.trim(),
      fundingInterests: splitList(form.fundingInterests),
      certifications: splitList(form.certifications),
      status: form.status,
      potentialFunding: Number(form.potentialFunding) || 0,
      summary: form.summary.trim(),
    };
    if (client) {
      updateClient(client.id, { ...base, website: form.website.trim(), employees: Number(form.employees) || 0 });
      toast.success("Client updated", { description: base.name });
    } else {
      const id = addClient({ ...base, contactName: form.contactName.trim(), contactTitle: form.contactTitle.trim(), contactEmail: form.contactEmail.trim(), contactPhone: form.contactPhone.trim() });
      toast.success("Client added", { description: `${base.name} is ready for onboarding.` });
      onCreated?.(id);
    }
    onDone();
  }

  const err = (k: keyof FormState) => errors[k] && <p className="text-xs text-red-600">{errors[k]}</p>;
  const field = (k: keyof FormState, label: string, opts: { placeholder?: string; type?: string; span?: boolean } = {}) => (
    <div className={opts.span ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label htmlFor={`cf-${k}`}>{label}</Label>
      <Input id={`cf-${k}`} type={opts.type} value={form[k] as string} placeholder={opts.placeholder} onChange={(e) => set(k, e.target.value as FormState[typeof k])} />
      {err(k)}
    </div>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{client ? "Edit client" : "Add client"}</DialogTitle>
        <DialogDescription>{client ? "Update organization details used for eligibility and matching." : "Create a client record. You can complete the funding profile afterwards."}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", "Company name *", { span: true })}
          <div className="space-y-1.5">
            <Label htmlFor="cf-org">Organization type</Label>
            <Select id="cf-org" value={form.organizationType} onChange={(e) => set("organizationType", e.target.value as OrganizationType)}>
              {ORG_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </div>
          {field("industry", "Industry *", { placeholder: "e.g. Fleet Services / Transportation" })}
          {field("city", "City")}
          {field("state", "State", { placeholder: "e.g. Texas" })}
          {field("naics", "NAICS codes (comma separated)", { placeholder: "811111, 488490" })}
          {field("serviceArea", "Service area")}
          {field("fundingInterests", "Funding interests (comma separated)", { span: true })}
          {field("certifications", "Certifications", { placeholder: "WOSB, Small Business" })}
          <div className="space-y-1.5">
            <Label htmlFor="cf-status">Client status</Label>
            <Select id="cf-status" value={form.status} onChange={(e) => set("status", e.target.value as ClientStatus)}>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          {field("potentialFunding", "Potential funding ($)", { type: "number" })}
          {client && field("employees", "Employees", { type: "number" })}
          {client && field("website", "Website")}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cf-summary">Business summary</Label>
            <Textarea id="cf-summary" rows={3} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
          </div>
          {!client && (
            <>
              <div className="sm:col-span-2 border-t border-border pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Primary contact</div>
              {field("contactName", "Name *")}
              {field("contactTitle", "Title")}
              {field("contactEmail", "Email", { type: "email" })}
              {field("contactPhone", "Phone")}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit">{client ? "Save changes" : "Add client"}</Button>
        </DialogFooter>
      </form>
    </>
  );
}
