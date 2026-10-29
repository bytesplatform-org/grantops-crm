"use client";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppData } from "@/lib/data-service";
import { GoNoGoPanel } from "./go-no-go-panel";

export function GoNoGoDialog({ matchId, open, onOpenChange, navigateOnApprove = true }: { matchId?: string; open: boolean; onOpenChange: (o: boolean) => void; navigateOnApprove?: boolean }) {
  const data = useAppData();
  const router = useRouter();
  const match = data.matches.find((m) => m.id === matchId);
  const opp = data.opportunities.find((o) => o.id === match?.opportunityId);
  const client = data.clients.find((c) => c.id === match?.clientId);
  return (
    <Dialog open={open && !!match} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Go / No-Go Assessment</DialogTitle>
          <DialogDescription>
            {opp?.title} · {client?.name}
          </DialogDescription>
        </DialogHeader>
        {matchId && (
          <GoNoGoPanel
            matchId={matchId}
            onApproved={(appId) => {
              onOpenChange(false);
              if (navigateOnApprove) router.push(`/applications/${appId}`);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
