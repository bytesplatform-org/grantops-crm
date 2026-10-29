import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { WritingIndex } from "@/components/writing/writing-index";

export const metadata = { title: "Writing Workspace" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WritingIndex />
    </Suspense>
  );
}
