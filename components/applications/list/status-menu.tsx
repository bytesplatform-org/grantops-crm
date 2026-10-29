"use client";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { APP_STATUS_COLOR, ApplicationStatusBadge } from "@/components/shared/status-badge";
import { setApplicationStatus } from "@/lib/data-service";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function changeStatus(app: Application, status: ApplicationStatus) {
  if (app.status === status) return;
  setApplicationStatus(app.id, status);
  toast.success(`Moved to ${status}`, { description: "Application stage updated." });
}

/** Status badge that opens a menu to change the application stage. */
export function StatusMenu({ app, className, compact = false }: { app: Application; className?: string; compact?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn("inline-flex items-center gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/30", className)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Change status"
        >
          <ApplicationStatusBadge status={app.status} />
          {!compact && <ChevronDown className="size-3.5 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {APPLICATION_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => changeStatus(app, s)}>
            <span className="size-2 rounded-full" style={{ background: APP_STATUS_COLOR[s] }} />
            <span className="flex-1">{s}</span>
            {app.status === s && <Check className="!text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
