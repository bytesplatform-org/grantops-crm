"use client";
import { Menu } from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { GlobalSearch } from "./global-search";
import { NotificationsMenu } from "./notifications-menu";

export function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:rounded-t-[24px]">
      <div className="flex h-16 items-center gap-4 px-4 lg:h-[76px] lg:px-8">
        <button className="rounded-lg p-1.5 text-zinc-600 hover:bg-muted lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <Breadcrumbs />
        </div>
        <div className="shrink-0 md:w-[380px]">
          <GlobalSearch />
        </div>
        <NotificationsMenu />
      </div>
    </header>
  );
}
