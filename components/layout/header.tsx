"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, Menu, RotateCcw, Settings, User } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/shared/avatar";
import { resetDemo, useAppData } from "@/lib/data-service";
import { clearSession } from "@/lib/storage";
import { Breadcrumbs } from "./breadcrumbs";
import { GlobalSearch } from "./global-search";
import { NotificationsMenu } from "./notifications-menu";

export function Header({ onMenu }: { onMenu: () => void }) {
  const data = useAppData();
  const router = useRouter();
  const user = data.team.find((t) => t.id === data.settings.currentUserId) ?? data.team[0];
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        <button className="rounded-md p-1.5 text-slate-600 hover:bg-muted lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <div className="hidden min-w-0 flex-1 md:block">
          <Breadcrumbs />
        </div>
        <div className="flex flex-1 justify-end md:flex-none md:w-[420px]">
          <GlobalSearch />
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 xl:inline-flex">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Demo Workspace
        </span>
        <NotificationsMenu />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 hover:bg-muted">
              <Avatar name={user.name} color={user.color} size="md" />
              <span className="hidden text-left leading-tight lg:block">
                <span className="block text-[13px] font-medium">{user.name}</span>
                <span className="block text-[11px] text-muted-foreground">{user.role}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <div className="text-sm font-medium text-foreground">{user.name}</div>
              <div className="text-xs font-normal text-muted-foreground">demo@grantos.local</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User /> Profile & preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Workspace settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                resetDemo();
                toast.success("Demo workspace reset", { description: "All sample data has been restored." });
              }}
            >
              <RotateCcw /> Reset demo data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                clearSession();
                router.push("/login");
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
