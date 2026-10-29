import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { LeadsView } from "@/components/leads/leads-view";

export const metadata = { title: "Leads" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LeadsView />
    </Suspense>
  );
}
