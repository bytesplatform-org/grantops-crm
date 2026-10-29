import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

export function NotFoundCard({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description="It may have been removed, or the demo data was reset."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{label}</Link>
        </Button>
      }
    />
  );
}
