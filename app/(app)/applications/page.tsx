import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ApplicationsView } from "@/components/applications/list/applications-view";

export const metadata = { title: "Applications" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApplicationsView />
    </Suspense>
  );
}
