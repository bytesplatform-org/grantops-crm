import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ApplicationDetailView } from "@/components/applications/detail/application-detail-view";

export const metadata = { title: "Application" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApplicationDetailView />
    </Suspense>
  );
}
