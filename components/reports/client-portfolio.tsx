"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { AppData } from "@/lib/types";
import { isActive } from "@/lib/selectors";
import { formatCompactCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientStatusBadge } from "@/components/shared/status-badge";

export function ClientPortfolio({ data }: { data: AppData }) {
  const rows = useMemo(() => {
    const r = data.clients.map((c) => {
      const apps = data.applications.filter((a) => a.clientId === c.id);
      return {
        client: c,
        open: apps.filter(isActive).length,
        pursued: apps.filter((a) => isActive(a) || a.status === "Submitted").reduce((s, a) => s + a.fundingRequested, 0),
        awarded: apps.filter((a) => a.status === "Awarded").reduce((s, a) => s + (a.outcome?.amountAwarded ?? a.fundingRequested), 0),
      };
    });
    return r.sort((a, b) => b.pursued + b.awarded - (a.pursued + a.awarded));
  }, [data]);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.pursued + r.awarded, r.client.potentialFunding)));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Open apps</TableHead>
          <TableHead className="text-right">Pursued</TableHead>
          <TableHead className="text-right">Awarded</TableHead>
          <TableHead className="text-right">Potential</TableHead>
          <TableHead className="w-48">Mix</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.client.id}>
            <TableCell>
              <Link href={`/clients/${r.client.id}`} className="font-medium hover:text-primary">
                {r.client.name}
              </Link>
              <div className="text-xs text-muted-foreground">{r.client.industry}</div>
            </TableCell>
            <TableCell>
              <ClientStatusBadge status={r.client.status} />
            </TableCell>
            <TableCell className="text-right tabular">{r.open}</TableCell>
            <TableCell className="text-right tabular">{formatCompactCurrency(r.pursued)}</TableCell>
            <TableCell className="text-right tabular text-emerald-700">{r.awarded ? formatCompactCurrency(r.awarded) : "—"}</TableCell>
            <TableCell className="text-right tabular text-muted-foreground">{formatCompactCurrency(r.client.potentialFunding)}</TableCell>
            <TableCell>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-emerald-500" style={{ width: `${(r.awarded / max) * 100}%` }} />
                <div className="h-full bg-primary" style={{ width: `${(r.pursued / max) * 100}%` }} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
