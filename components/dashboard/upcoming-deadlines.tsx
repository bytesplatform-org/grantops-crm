"use client";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import type { AppData } from "@/lib/types";
import { upcomingDeadlines } from "@/lib/selectors";
import { cn, daysUntil, formatCompactCurrency, formatShortDate, initials } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApplicationStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { orgTone } from "./dashboard-metrics";

export function UpcomingDeadlines({ data, limit = 6 }: { data: AppData; limit?: number }) {
  const router = useRouter();
  const apps = upcomingDeadlines(data, limit);
  if (!apps.length) return <EmptyState icon={CalendarClock} title="No upcoming deadlines" />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Deadline</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apps.map((a) => {
          const opp = data.opportunities.find((o) => o.id === a.opportunityId);
          const client = data.clients.find((c) => c.id === a.clientId);
          const d = daysUntil(a.deadline);
          return (
            <TableRow key={a.id} className="cursor-pointer" onClick={() => router.push(`/applications/${a.id}`)}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white", orgTone(a.clientId))}>
                    {initials(client?.name ?? "?")}
                  </span>
                  <div className="min-w-0 max-w-[260px]">
                    <div className="truncate text-[13px] font-medium">{client?.name}</div>
                    <div className="truncate text-[12px] text-muted-foreground">{opp?.title}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <ApplicationStatusBadge status={a.status} />
              </TableCell>
              <TableCell className="text-right text-[13px] tabular">{formatCompactCurrency(a.fundingRequested)}</TableCell>
              <TableCell className="whitespace-nowrap text-right text-[13px]">
                <span className={cn("tabular", d <= 3 ? "font-medium text-red-600" : d <= 10 ? "text-amber-600" : "text-zinc-600")}>
                  {formatShortDate(a.deadline)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
