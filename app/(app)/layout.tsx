import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/shared/page-skeleton";

function ShellFallback() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-60 shrink-0 bg-sidebar lg:block" />
      <div className="flex-1 p-8">
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
