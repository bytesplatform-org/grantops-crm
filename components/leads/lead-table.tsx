"use client";
import { Ban, BadgeCheck, Eye, Mail, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/types";
import { moveLeadStage, useAppData } from "@/lib/data-service";
import { cn, daysUntil, formatCurrency, relativeTime } from "@/lib/utils";

export function LeadTable({
  leads,
  onOpen,
  onEmail,
  onEdit,
  onDelete,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onEmail: (leadId: string) => void;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}) {
  const data = useAppData();
  if (!leads.length) return <EmptyState icon={UserPlus} title="No leads match your filters" description="Adjust search or filters, or run Sync now to discover new prospects." />;
  const unreadBy = new Set(data.emails.filter((e) => e.direction === "inbound" && !e.read).map((e) => e.leadId));
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Est. Value</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Next Action</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => {
            const fresh = l.stage === "New Lead" && daysUntil(l.discoveredAt) === 0;
            return (
              <TableRow key={l.id} className="cursor-pointer" onClick={() => onOpen(l.id)}>
                <TableCell>
                  <div className="flex items-center gap-2 whitespace-nowrap font-medium">
                    {l.company}
                    {fresh && <span className="rounded-md bg-brand px-1.5 text-[11px] font-semibold leading-5 text-zinc-900">New</span>}
                  </div>
                  <div className="max-w-[280px] truncate text-[12px] text-muted-foreground" title={l.source}>
                    via {l.source.split(" — ")[0]} · {relativeTime(l.discoveredAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {l.contactName}
                    {unreadBy.has(l.id) && <span className="size-2 rounded-full bg-lime-500" title="Unread reply" />}
                  </div>
                  <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                    <span className={cn(l.optedOut && "line-through")}>{l.email}</span>
                    {l.optedOut ? (
                      <Ban className="size-3.5 shrink-0 text-red-500" aria-label="Opted out" />
                    ) : (
                      l.emailConfidence === "Verified" && <BadgeCheck className="size-3.5 shrink-0 text-emerald-600" aria-label="Verified email" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular">{formatCurrency(l.estimatedValue)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    aria-label={`Stage for ${l.company}`}
                    value={l.stage}
                    onValueChange={(v) => {
                      moveLeadStage(l.id, v as LeadStage);
                      toast.success(`${l.company} moved to ${v}`);
                    }}
                    className="h-7 min-w-max rounded-md border border-border bg-card px-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    {LEAD_STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell className="max-w-56 truncate text-[13px] text-muted-foreground">{l.nextAction}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Email ${l.contactName}`}
                      title={l.optedOut ? "Opted out — outreach blocked" : `Email ${l.contactName}`}
                      disabled={l.optedOut}
                      onClick={() => onEmail(l.id)}
                    >
                      <Mail className="size-4" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label={`Actions for ${l.company}`}>
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onOpen(l.id)}>
                          <Eye /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEdit(l)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onSelect={() => onDelete(l)}>
                          <Trash2 /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
