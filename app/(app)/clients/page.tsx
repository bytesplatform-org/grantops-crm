import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ClientsView } from "@/components/clients/clients-view";

export const metadata = { title: "Clients" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientsView />
    </Suspense>
  );
}
