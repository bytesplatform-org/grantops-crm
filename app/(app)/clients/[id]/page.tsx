import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ClientDetailView } from "@/components/clients/client-detail-view";

export const metadata = { title: "Client" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientDetailView />
    </Suspense>
  );
}
