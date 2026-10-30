import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { NewsView } from "@/components/news/news-view";

export const metadata = { title: "Grant News" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewsView />
    </Suspense>
  );
}
