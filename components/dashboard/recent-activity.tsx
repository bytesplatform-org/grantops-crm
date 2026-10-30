"use client";
import Link from "next/link";
import type { AppData } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MemberAvatar } from "@/components/shared/avatar";
import { memberName } from "@/lib/selectors";

export function RecentActivity({ data, limit = 5 }: { data: AppData; limit?: number }) {
  const items = [...data.activities].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit);
  if (!items.length) return <p className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Team member</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead className="w-[72px] text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((a) => {
          const client = data.clients.find((c) => c.id === a.clientId);
          const href = a.applicationId ? `/applications/${a.applicationId}` : client ? `/clients/${client.id}` : undefined;
          return (
            <TableRow key={a.id}>
              <TableCell>
                <div className="flex min-w-0 items-center gap-2.5">
                  <MemberAvatar id={a.actorId} size="md" />
                  <span className="truncate text-[13px] font-medium">{memberName(data, a.actorId)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="truncate text-[13px] text-zinc-700" title={a.message}>
                  {a.message}
                </div>
                {client &&
                  (href ? (
                    <Link href={href} className="block truncate text-[12px] text-muted-foreground hover:text-foreground hover:underline">
                      {client.name}
                    </Link>
                  ) : (
                    <span className="block truncate text-[12px] text-muted-foreground">{client.name}</span>
                  ))}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-[12px] text-muted-foreground">{relativeTime(a.createdAt)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
