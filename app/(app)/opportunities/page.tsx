import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { OpportunitiesView } from "@/components/opportunities/opportunities-view";

export const metadata = { title: "Funding Opportunities" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OpportunitiesView />
    </Suspense>
  );
}
