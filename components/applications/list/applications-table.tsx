"use client";
import { useRouter } from "next/navigation";
import { FileWarning } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberAvatar } from "@/components/shared/avatar";
import { Deadline } from "@/components/shared/deadline";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { changeStatus } from "./status-menu";
import type { AppRow } from "./use-application-rows";
import { Select } from "@/components/ui/select";

export function ApplicationsTable({ rows }: { rows: AppRow[] }) {
  const router = useRouter();
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Grant</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Agency</TableHead>
            <TableHead className="text-right">Requested</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Completion</TableHead>
            <TableHead>Writer</TableHead>
            <TableHead>Missing docs</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ app, opp, client, completion, missingDocs }) => (
            <TableRow key={app.id} className="cursor-pointer" onClick={() => router.push(`/applications/${app.id}`)}>
              <TableCell className="max-w-[280px]">
                <div className="truncate font-medium">{opp?.title}</div>
                <div className="truncate text-xs text-muted-foreground">{opp?.opportunityNumber}</div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">{client?.name}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{opp?.agencyCode}</TableCell>
              <TableCell className="text-right font-medium tabular">{formatCurrency(app.fundingRequested)}</TableCell>
              <TableCell>
                <Deadline date={app.deadline} compact />
              </TableCell>
              <TableCell className="w-36">
                <div className="flex items-center gap-2">
                  <Progress value={completion} className="w-20" indicatorClassName={completion === 100 ? "bg-emerald-500" : undefined} />
                  <span className="text-xs tabular">{completion}%</span>
                </div>
              </TableCell>
              <TableCell>
                <MemberAvatar id={app.writerId} showName size="xs" />
              </TableCell>
              <TableCell>
                {missingDocs > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                    <FileWarning className="size-3.5" /> {missingDocs}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  aria-label="Status"
                  value={app.status}
                  onValueChange={(v) => changeStatus(app, v as ApplicationStatus)}
                  className="h-8 rounded-md border border-input bg-card px-2 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
