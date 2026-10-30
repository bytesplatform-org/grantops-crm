import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/shared/page-skeleton";

function ShellFallback() {
  return (
    <div className="flex min-h-screen bg-frame lg:p-3">
      <div className="hidden w-64 shrink-0 lg:block" />
      <div className="flex-1 bg-background p-8 lg:rounded-[24px]">
        <PageSkeleton />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
