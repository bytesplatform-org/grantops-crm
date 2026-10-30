"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deliverDueReplies } from "@/lib/data-service";

/** Delivers simulated lead replies once they're due, on whatever page is open. */
export function MailScheduler() {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      for (const m of deliverDueReplies()) {
        toast(`New reply from ${m.fromName}`, {
          description: m.subject,
          action: { label: "Open", onClick: () => router.push(`/leads?tab=inbox&thread=${m.threadId}`) },
        });
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
