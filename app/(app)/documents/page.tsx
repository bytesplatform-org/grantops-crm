import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { DocumentsView } from "@/components/documents/documents-view";

export const metadata = { title: "Documents" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DocumentsView />
    </Suspense>
  );
}
