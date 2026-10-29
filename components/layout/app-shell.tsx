"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { useHydrated } from "@/lib/store";
import { getSession } from "@/lib/storage";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const authed = hydrated && !!getSession();

  useEffect(() => {
    if (hydrated && !getSession()) router.replace("/login");
  }, [hydrated, router]);

  if (!authed) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-60 shrink-0 bg-sidebar lg:block" />
        <div className="flex-1 p-8">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
          <Sidebar />
        </div>
        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 lg:hidden">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
          <Header onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-[1480px]">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
