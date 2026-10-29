import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { OpportunityDetailView } from "@/components/opportunities/opportunity-detail-view";

export const metadata = { title: "Opportunity" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OpportunityDetailView />
    </Suspense>
  );
}
