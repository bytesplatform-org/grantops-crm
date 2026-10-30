import { Briefcase, FolderKanban, GitCompareArrows, LayoutDashboard, Newspaper, Search, UserPlus } from "lucide-react";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/clients", label: "Clients", icon: Briefcase },
  { href: "/opportunities", label: "Funding Opportunities", icon: Search },
  { href: "/matches", label: "Matches", icon: GitCompareArrows },
  { href: "/applications", label: "Applications", icon: FolderKanban },
  { href: "/news", label: "Grant News", icon: Newspaper },
] as const;

export const BRAND = { name: "GrantOS", subtitle: "Funding Operations" } as const;
