"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark } from "lucide-react";
import { useAppData } from "@/lib/store";
import { isActive } from "@/lib/selectors";
import { cn, daysUntil } from "@/lib/utils";
import { BRAND, NAV, SETTINGS_NAV } from "./nav";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const data = useAppData();
  const counts: Record<string, number> = {
    "/applications": data.applications.filter(isActive).length,
    "/matches": data.matches.filter((m) => m.status === "New").length,
    "/tasks": data.tasks.filter((t) => t.status !== "Done" && daysUntil(t.dueDate) <= 1).length,
  };
  const linkCls = (active: boolean) =>
    cn(
      "group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors",
      active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
    );
  const isOn = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-white shadow-sm">
          <Landmark className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">{BRAND.name}</div>
          <div className="text-[11px] text-sidebar-muted">{BRAND.subtitle}</div>
        </div>
      </div>
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-2.5 py-4">
        <div className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">Workspace</div>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = isOn(item.href) || (item.href === "/writing" && /\/applications\/[^/]+\/writing/.test(pathname));
            const activeApps = item.href === "/applications" && active && /\/writing$/.test(pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={onNavigate} className={linkCls(active && !activeApps)}>
                  <Icon className={cn("size-4", active && !activeApps ? "text-blue-300" : "text-sidebar-muted group-hover:text-sidebar-foreground")} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {counts[item.href] ? (
                    <span className="rounded bg-sidebar-border px-1.5 text-[10px] font-semibold text-sidebar-foreground tabular">{counts[item.href]}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border px-2.5 py-3">
        <Link href={SETTINGS_NAV.href} onClick={onNavigate} className={linkCls(isOn(SETTINGS_NAV.href))}>
          <SETTINGS_NAV.icon className="size-4 text-sidebar-muted" />
          {SETTINGS_NAV.label}
        </Link>
        <div className="mt-3 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5">
          <div className="text-[11px] font-medium text-white">{data.settings.firmName}</div>
          <div className="mt-0.5 text-[10px] text-sidebar-muted">
            {data.clients.length} clients · {data.team.length} team members
          </div>
        </div>
      </div>
    </aside>
  );
}
