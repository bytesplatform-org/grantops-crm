"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAppData } from "@/lib/store";
import { NAV, SETTINGS_NAV } from "./nav";

export function Breadcrumbs() {
  const pathname = usePathname();
  const data = useAppData();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [];
  let href = "";
  parts.forEach((p, i) => {
    href += `/${p}`;
    const nav = [...NAV, SETTINGS_NAV].find((n) => n.href === href);
    let label = nav?.label ?? p.charAt(0).toUpperCase() + p.slice(1);
    if (i > 0) {
      const prev = parts[i - 1];
      if (prev === "clients") label = data.clients.find((c) => c.id === p)?.name ?? "Client";
      if (prev === "opportunities") label = data.opportunities.find((o) => o.id === p)?.title ?? "Opportunity";
      if (prev === "applications") {
        const a = data.applications.find((x) => x.id === p);
        const o = data.opportunities.find((x) => x.id === a?.opportunityId);
        label = o?.title ?? "Application";
      }
      if (p === "writing") label = "Writing Workspace";
    }
    crumbs.push({ href, label });
  });
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
      <Link href="/dashboard" className="shrink-0 text-muted-foreground hover:text-foreground">
        GrantOS
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-foreground">{c.label}</span>
          ) : (
            <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
