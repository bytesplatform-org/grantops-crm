"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAppData } from "@/lib/store";
import { NAV } from "./nav";

const SECTION_LABELS: Record<string, string> = {
  writing: "Writing Workspace",
  tasks: "Tasks & Calendar",
};

/** Page title for the top bar: the section name, followed by a compact trail on nested routes. */
export function Breadcrumbs() {
  const pathname = usePathname();
  const data = useAppData();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [];
  let href = "";
  parts.forEach((p, i) => {
    href += `/${p}`;
    const nav = NAV.find((n) => n.href === href);
    let label = nav?.label ?? SECTION_LABELS[p] ?? p.charAt(0).toUpperCase() + p.slice(1);
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
  const [section, ...rest] = crumbs;
  if (!section) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
      {rest.length ? (
        <Link href={section.href} className="shrink-0 text-xl font-bold tracking-tight text-foreground hover:text-zinc-600 lg:text-[26px]">
          {section.label}
        </Link>
      ) : (
        <span className="truncate text-xl font-bold tracking-tight text-foreground lg:text-[26px]">{section.label}</span>
      )}
      {rest.map((c, i) => (
        <span key={c.href} className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <ChevronRight className="size-4 shrink-0 text-zinc-300" />
          {i === rest.length - 1 ? (
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
