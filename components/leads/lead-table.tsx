"use client";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/types";
import { moveLeadStage } from "@/lib/data-service";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { UserPlus } from "lucide-react";

export function LeadTable({
  leads,
  onOpen,
  onEdit,
  onDelete,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
}) {
  if (!leads.length) return <EmptyState icon={UserPlus} title="No leads match your filters" description="Adjust search or filters, or add a new lead." />;
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Org Type</TableHead>
            <TableHead className="text-right">Est. Value</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Next Action</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id} className="cursor-pointer" onClick={() => onOpen(l.id)}>
              <TableCell className="font-medium whitespace-nowrap">{l.company}</TableCell>
              <TableCell>
                <div className="whitespace-nowrap">{l.contactName}</div>
                <div className="text-[13px] text-muted-foreground">{l.email}</div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-[13px] text-muted-foreground">{l.organizationType}</TableCell>
              <TableCell className="text-right font-medium tabular">{formatCurrency(l.estimatedValue)}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <select
                  aria-label={`Stage for ${l.company}`}
                  value={l.stage}
                  onChange={(e) => {
                    moveLeadStage(l.id, e.target.value as LeadStage);
                    toast.success(`${l.company} moved to ${e.target.value}`);
                  }}
                  className="h-7 rounded-md border border-border bg-card px-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {LEAD_STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </TableCell>
              <TableCell className="max-w-56 truncate text-[13px] text-muted-foreground">{l.nextAction}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label={`Actions for ${l.company}`}>
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => onOpen(l.id)}>
                      <Eye /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEdit(l)}>
                      <Pencil /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => onDelete(l)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
