"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Landmark, Sparkles } from "lucide-react";
import { useAppData } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BRAND, NAV } from "./nav";
import { ProfileMenu } from "./profile-menu";

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const data = useAppData();
  const counts: Record<string, number> = {
    "/matches": data.matches.filter((m) => m.status === "New").length,
  };
  const isOn = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
    <aside className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200", collapsed ? "w-[76px]" : "w-64")}>
      <div className={cn("flex h-[76px] items-center gap-2.5", collapsed ? "justify-center px-2" : "px-5")}>
        <button
          type="button"
          onClick={collapsed ? onToggleCollapse : undefined}
          tabIndex={collapsed ? 0 : -1}
          aria-label={collapsed ? "Expand sidebar" : undefined}
          className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground", !collapsed && "cursor-default")}
        >
          <Landmark className="size-[18px]" />
        </button>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[19px] font-bold tracking-tight text-white">{BRAND.name}</div>
              <div className="text-[11px] text-sidebar-muted">{BRAND.subtitle}</div>
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="flex size-7 items-center justify-center rounded-full border border-sidebar-border text-sidebar-muted transition-colors hover:text-white"
              >
                <ArrowLeft className="size-3.5" />
              </button>
            )}
          </>
        )}
      </div>
      <nav className={cn("sidebar-scroll flex-1 overflow-y-auto py-4", collapsed ? "px-3" : "px-4")}>
        <ul className="space-y-1.5">
          {NAV.map((item) => {
            const active = isOn(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="relative">
                {active && <span className={cn("absolute top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-brand", collapsed ? "-left-3" : "-left-4")} />}
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl py-2.5 text-[15px] transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    active ? "bg-sidebar-accent font-medium text-brand" : "hover:bg-sidebar-accent/60 hover:text-white",
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", active ? "text-brand" : "text-sidebar-foreground")} />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && counts[item.href] ? (
                    <span className="rounded-full bg-brand/15 px-1.5 text-[11px] font-medium text-brand tabular">{counts[item.href]}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="rounded-2xl bg-zinc-200 p-4 text-foreground">
            <span className="flex size-10 items-center justify-center rounded-xl bg-dark text-white">
              <Sparkles className="size-[18px]" />
            </span>
            <div className="mt-3 text-[17px] font-semibold tracking-tight">Find new funding</div>
            <p className="mt-1 text-[13px] leading-snug text-zinc-600">Score a client against open federal opportunities in seconds.</p>
            <Link
              href="/opportunities"
              onClick={onNavigate}
              className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-dark text-[13px] font-medium text-white transition-colors hover:bg-[#2e323a]"
            >
              Find Funding <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
      <div className={cn("pb-4", collapsed ? "px-3" : "px-3")}>
        <ProfileMenu onNavigate={onNavigate} compact={collapsed} />
      </div>
    </aside>
  );
}
