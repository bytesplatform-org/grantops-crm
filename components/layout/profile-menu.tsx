"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, RotateCcw, SlidersHorizontal, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/shared/avatar";
import { resetDemo, useAppData } from "@/lib/data-service";
import { clearSession } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function ProfileMenu({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const data = useAppData();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const user = data.team.find((t) => t.id === data.settings.currentUserId) ?? data.team[0];
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={compact ? "Account menu" : undefined}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl bg-sidebar-accent py-2 text-left transition-colors hover:bg-[#363a43] data-[state=open]:bg-[#363a43]",
              compact ? "justify-center px-0" : "px-2",
            )}
          >
            <Avatar name={user.name} color="bg-brand text-brand-foreground" size="lg" />
            {!compact && (
              <>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[14px] font-medium text-white">{user.name}</span>
                  <span className="block truncate text-[12px] text-sidebar-muted">{user.email}</span>
                </span>
                <ChevronUp className="size-4 shrink-0 text-sidebar-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56">
          <DropdownMenuItem asChild>
            <Link href="/settings" onClick={onNavigate}>
              <User /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" onClick={onNavigate}>
              <SlidersHorizontal /> Preferences
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirm(true)}>
            <RotateCcw /> Reset Demo Workspace
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

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo workspace?</DialogTitle>
            <DialogDescription>All changes made in this browser will be replaced with the original sample data.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetDemo();
                setConfirm(false);
                toast.success("Demo workspace reset", { description: "All sample data has been restored." });
              }}
            >
              <RotateCcw /> Reset workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
