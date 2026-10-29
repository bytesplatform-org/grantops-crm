"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { Deadline } from "@/components/shared/deadline";
import { MemberAvatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppData } from "@/lib/data-service";
import { applicationCompletion } from "@/lib/selectors";
import type { Application } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ClientApplicationsTab({ apps }: { apps: Application[] }) {
  const data = useAppData();
  const router = useRouter();
  if (!apps.length) return <EmptyState icon={FolderKanban} title="No applications yet" description="Approve a Go/No-Go on a matched opportunity to start an application workspace." />;
  const sorted = [...apps].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Grant</TableHead>
            <TableHead>Agency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Requested</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Completion</TableHead>
            <TableHead>Writer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((a) => {
            const opp = data.opportunities.find((o) => o.id === a.opportunityId);
            const pct = applicationCompletion(a);
            return (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => router.push(`/applications/${a.id}`)}>
                <TableCell>
                  <Link href={`/applications/${a.id}`} className="font-medium hover:text-primary" onClick={(e) => e.stopPropagation()}>
                    {opp?.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">{opp?.opportunityNumber}</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">{opp?.agency}</TableCell>
                <TableCell>
                  <ApplicationStatusBadge status={a.status} />
                </TableCell>
                <TableCell className="text-right font-medium tabular">{formatCurrency(a.outcome?.amountAwarded || a.fundingRequested)}</TableCell>
                <TableCell>
                  <Deadline date={a.deadline} compact />
                </TableCell>
                <TableCell className="w-40">
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="flex-1" />
                    <span className="w-9 text-right text-xs tabular">{pct}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <MemberAvatar id={a.writerId} showName size="xs" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
