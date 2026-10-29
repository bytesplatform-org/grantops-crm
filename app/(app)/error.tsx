"use client";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetDemo } from "@/lib/data-service";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="text-base font-semibold">Something went wrong loading this view</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">Try again, or restore the sample data if the local workspace was modified in an unexpected way.</p>
      <div className="mt-5 flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          onClick={() => {
            resetDemo();
            reset();
          }}
        >
          <RotateCcw /> Reset demo data
        </Button>
      </div>
    </div>
  );
}
