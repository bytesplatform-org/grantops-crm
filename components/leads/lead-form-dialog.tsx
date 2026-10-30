"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addLead, updateLead, useAppData } from "@/lib/data-service";
import { LEAD_STAGES, type Lead, type LeadStage, type OrganizationType, type ProposalStatus } from "@/lib/types";
import { isoFromNow } from "@/lib/utils";
import { LEAD_SOURCES, ORG_TYPES, PROPOSAL_STATUSES, fromDateInput, splitList, toDateInput } from "./constants";

interface FormState {
  company: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  organizationType: OrganizationType;
  location: string;
  fundingNeed: string;
  estimatedValue: string;
  source: string;
  stage: LeadStage;
  nextAction: string;
  nextActionDate: string;
  ownerId: string;
  fundingGoals: string;
  grantCategories: string;
  proposalStatus: ProposalStatus;
  proposalValue: string;
}

function initial(lead?: Lead, ownerId = "u-sarah"): FormState {
  return {
    company: lead?.company ?? "",
    contactName: lead?.contactName ?? "",
    contactTitle: lead?.contactTitle ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    organizationType: lead?.organizationType ?? "Small Business",
    location: lead?.location ?? "",
    fundingNeed: lead?.fundingNeed ?? "",
    estimatedValue: lead ? String(lead.estimatedValue) : "",
    source: lead?.source ?? LEAD_SOURCES[0],
    stage: lead?.stage ?? "New Inquiry",
    nextAction: lead?.nextAction ?? "Schedule intro call",
    nextActionDate: toDateInput(lead?.nextActionDate ?? isoFromNow(2)),
    ownerId: lead?.ownerId ?? ownerId,
    fundingGoals: lead?.fundingGoals.join(", ") ?? "",
    grantCategories: lead?.grantCategories.join(", ") ?? "",
    proposalStatus: lead?.proposalStatus ?? "Not Started",
    proposalValue: lead ? String(lead.proposalValue) : "0",
  };
}

export function LeadFormDialog({ open, onOpenChange, lead }: { open: boolean; onOpenChange: (o: boolean) => void; lead?: Lead }) {
  const data = useAppData();
  const [form, setForm] = useState<FormState>(() => initial(lead, data.settings.currentUserId));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [lastKey, setLastKey] = useState<string>("");

  // Reset the form whenever the dialog opens for a different lead.
  const key = `${open}-${lead?.id ?? "new"}`;
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setForm(initial(lead, data.settings.currentUserId));
      setErrors({});
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.contactName.trim()) errs.contactName = "Contact is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const payload = {
      company: form.company.trim(),
      contactName: form.contactName.trim(),
      contactTitle: form.contactTitle.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      organizationType: form.organizationType,
      location: form.location.trim(),
      fundingNeed: form.fundingNeed.trim(),
      estimatedValue: Number(form.estimatedValue) || 0,
      source: form.source,
      stage: form.stage,
      nextAction: form.nextAction.trim(),
      nextActionDate: fromDateInput(form.nextActionDate),
      ownerId: form.ownerId,
      fundingGoals: splitList(form.fundingGoals),
      grantCategories: splitList(form.grantCategories),
      proposalStatus: form.proposalStatus,
      proposalValue: Number(form.proposalValue) || 0,
    };
    if (lead) {
      updateLead(lead.id, payload);
      toast.success("Lead updated", { description: payload.company });
    } else {
      addLead(payload);
      toast.success("Lead added", { description: `${payload.company} added to New Inquiry.` });
    }
    onOpenChange(false);
  }

  const err = (k: keyof FormState) => errors[k] && <p className="text-xs text-red-600">{errors[k]}</p>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit lead" : "Add lead"}</DialogTitle>
          <DialogDescription>Business development record for a prospective consulting client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lf-company">Company *</Label>
              <Input id="lf-company" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Organization name" />
              {err("company")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-contact">Contact name *</Label>
              <Input id="lf-contact" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
              {err("contactName")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-title">Title</Label>
              <Input id="lf-title" value={form.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-email">Email *</Label>
              <Input id="lf-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {err("email")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-phone">Phone</Label>
              <Input id="lf-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-org">Organization type</Label>
              <Select id="lf-org" value={form.organizationType} onValueChange={(v) => set("organizationType", v as OrganizationType)}>
                {ORG_TYPES.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-loc">Location</Label>
              <Input id="lf-loc" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, State" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lf-need">Funding need</Label>
              <Textarea id="lf-need" rows={2} value={form.fundingNeed} onChange={(e) => set("fundingNeed", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-value">Estimated project value ($)</Label>
              <Input id="lf-value" type="number" min={0} value={form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-source">Lead source</Label>
              <Select id="lf-source" value={form.source} onValueChange={(v) => set("source", v)}>
                {[...new Set([form.source, ...LEAD_SOURCES])].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-stage">Stage</Label>
              <Select id="lf-stage" value={form.stage} onValueChange={(v) => set("stage", v as LeadStage)}>
                {LEAD_STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-owner">Owner</Label>
              <Select id="lf-owner" value={form.ownerId} onValueChange={(v) => set("ownerId", v)}>
                {data.team.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-next">Next action</Label>
              <Input id="lf-next" value={form.nextAction} onChange={(e) => set("nextAction", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-nextdate">Next action date</Label>
              <Input id="lf-nextdate" type="date" value={form.nextActionDate} onChange={(e) => set("nextActionDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-goals">Funding goals (comma separated)</Label>
              <Input id="lf-goals" value={form.fundingGoals} onChange={(e) => set("fundingGoals", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-cats">Possible grant categories</Label>
              <Input id="lf-cats" value={form.grantCategories} onChange={(e) => set("grantCategories", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-prop">Proposal status</Label>
              <Select id="lf-prop" value={form.proposalStatus} onValueChange={(v) => set("proposalStatus", v as ProposalStatus)}>
                {PROPOSAL_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lf-propval">Engagement value ($)</Label>
              <Input id="lf-propval" type="number" min={0} value={form.proposalValue} onChange={(e) => set("proposalValue", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{lead ? "Save changes" : "Add lead"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
