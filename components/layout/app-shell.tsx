"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { useHydrated } from "@/lib/store";
import { getSession } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const authed = hydrated && !!getSession();

  useEffect(() => {
    if (hydrated && !getSession()) router.replace("/login");
  }, [hydrated, router]);

  if (!authed) {
    return (
      <div className="flex min-h-screen bg-frame lg:p-3">
        <div className="hidden w-64 shrink-0 lg:block" />
        <div className="flex-1 bg-background p-8 lg:rounded-[24px]">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-frame">
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
        </div>
        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/50 lg:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200 lg:h-screen lg:py-3 lg:pr-3", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
          <div className="scrollbar-thin flex min-h-screen flex-1 flex-col bg-background lg:h-[calc(100vh-1.5rem)] lg:min-h-0 lg:overflow-y-auto lg:rounded-[24px]">
            <Header onMenu={() => setMobileOpen(true)} />
            <main className="flex-1 px-4 pb-6 pt-2 lg:px-8 lg:pb-8">
              <div className="mx-auto w-full max-w-[1480px]">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
