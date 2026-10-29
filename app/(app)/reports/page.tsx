import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReportsView />
    </Suspense>
  );
}
