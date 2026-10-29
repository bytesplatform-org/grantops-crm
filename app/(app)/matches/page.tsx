import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { MatchesView } from "@/components/matches/matches-view";

export const metadata = { title: "Matches" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MatchesView />
    </Suspense>
  );
}
