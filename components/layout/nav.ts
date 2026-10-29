import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  FileStack,
  FolderKanban,
  GitCompareArrows,
  LayoutDashboard,
  PenLine,
  Search,
  Settings,
  UserPlus,
} from "lucide-react";

export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/clients", label: "Clients", icon: Briefcase },
  { href: "/opportunities", label: "Funding Opportunities", icon: Search },
  { href: "/matches", label: "Matches", icon: GitCompareArrows },
  { href: "/applications", label: "Applications", icon: FolderKanban },
  { href: "/writing", label: "Writing Workspace", icon: PenLine },
  { href: "/documents", label: "Documents", icon: FileStack },
  { href: "/tasks", label: "Tasks & Calendar", icon: CalendarCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export const SETTINGS_NAV = { href: "/settings", label: "Settings", icon: Settings } as const;

export const BRAND = { name: "GrantOS", subtitle: "Funding Operations" } as const;
