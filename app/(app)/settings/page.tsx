import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsView />
    </Suspense>
  );
}
