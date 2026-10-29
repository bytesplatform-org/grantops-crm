import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { WritingWorkspace } from "@/components/writing/writing-workspace";

export const metadata = { title: "Writing Workspace" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WritingWorkspace />
    </Suspense>
  );
}
