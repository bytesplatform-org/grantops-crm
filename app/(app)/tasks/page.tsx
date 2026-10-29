import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata = { title: "Tasks & Calendar" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TasksView />
    </Suspense>
  );
}
