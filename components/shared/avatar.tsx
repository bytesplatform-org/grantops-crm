"use client";
import { useAppData } from "@/lib/store";
import { cn, initials } from "@/lib/utils";

const SIZES = { xs: "size-5 text-[9px]", sm: "size-6 text-[10px]", md: "size-8 text-xs", lg: "size-10 text-sm" } as const;

export function Avatar({ name, color = "bg-slate-500", size = "sm", className }: { name: string; color?: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", color, SIZES[size], className)} title={name}>
      {initials(name)}
    </span>
  );
}

/** Avatar for a team member id (or "client"). */
export function MemberAvatar({ id, size = "sm", showName = false, className }: { id?: string; size?: keyof typeof SIZES; showName?: boolean; className?: string }) {
  const data = useAppData();
  const m = data.team.find((t) => t.id === id);
  const name = m?.name ?? (id === "client" ? "Client" : id === "system" ? "GrantOS" : "Unassigned");
  const color = m?.color ?? (id === "client" ? "bg-teal-600" : "bg-slate-400");
  if (!showName) return <Avatar name={name} color={color} size={size} className={className} />;
  return (
    <span className={cn("inline-flex items-center gap-2 min-w-0", className)}>
      <Avatar name={name} color={color} size={size} />
      <span className="truncate text-sm">{name}</span>
    </span>
  );
}
