"use client";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  FileText,
  FileUp,
  GitCompareArrows,
  ListChecks,
  MessageSquare,
  PenLine,
  ScanSearch,
  Send,
  ShieldCheck,
  UserPlus,
  Wallet,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";
import { useAppData } from "@/lib/store";
import { cn, relativeTime } from "@/lib/utils";
import { MemberAvatar } from "./avatar";

const ICON: Record<ActivityType, { icon: LucideIcon; cls: string }> = {
  eligibility: { icon: ShieldCheck, cls: "text-emerald-600 bg-emerald-50" },
  document: { icon: FileUp, cls: "text-teal-600 bg-teal-50" },
  writing: { icon: PenLine, cls: "text-blue-600 bg-blue-50" },
  match: { icon: GitCompareArrows, cls: "text-indigo-600 bg-indigo-50" },
  status: { icon: CheckCircle2, cls: "text-slate-700 bg-slate-100" },
  budget: { icon: Wallet, cls: "text-amber-600 bg-amber-50" },
  review: { icon: MessageSquare, cls: "text-violet-600 bg-violet-50" },
  task: { icon: ListChecks, cls: "text-sky-600 bg-sky-50" },
  client: { icon: Briefcase, cls: "text-slate-600 bg-slate-100" },
  lead: { icon: UserPlus, cls: "text-pink-600 bg-pink-50" },
  submission: { icon: Send, cls: "text-slate-800 bg-slate-100" },
  analysis: { icon: ScanSearch, cls: "text-blue-700 bg-blue-50" },
  note: { icon: FileText, cls: "text-slate-600 bg-slate-100" },
};

export function ActivityFeed({
  items,
  limit = 10,
  showContext = true,
  className,
}: {
  items: Activity[];
  limit?: number;
  showContext?: boolean;
  className?: string;
}) {
  const data = useAppData();
  const list = [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit);
  if (!list.length) return <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ol className={cn("relative space-y-0", className)}>
      {list.map((a, i) => {
        const I = ICON[a.type] ?? ICON.note;
        const client = data.clients.find((c) => c.id === a.clientId);
        const award = a.message.startsWith("Award recorded");
        return (
          <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < list.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-24px)] w-px bg-border" />}
            <span className={cn("relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full", award ? "bg-emerald-50 text-emerald-600" : I.cls)}>
              {award ? <Award className="size-3.5" /> : <I.icon className="size-3.5" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] leading-snug text-foreground">{a.message}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                {a.actorId !== "system" && <MemberAvatar id={a.actorId} size="xs" />}
                <span>{relativeTime(a.createdAt)}</span>
                {showContext && client && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Link href={a.applicationId ? `/applications/${a.applicationId}` : `/clients/${client.id}`} className="truncate hover:text-primary hover:underline">
                      {client.name}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
