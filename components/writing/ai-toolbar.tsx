"use client";
import { ListChecks, Loader2, Minimize2, Sparkles, Undo2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AiAction = "draft" | "improve" | "shorten" | "check";

export function AiToolbar({
  busy,
  hasText,
  canUndo,
  onAction,
  onUndo,
}: {
  busy: AiAction | null;
  hasText: boolean;
  canUndo: boolean;
  onAction: (a: AiAction) => void;
  onUndo: () => void;
}) {
  const btn = (a: AiAction, label: string, Icon: React.ComponentType, disabled = false) => (
    <Button variant={a === "draft" ? "default" : "outline"} size="sm" disabled={!!busy || disabled} onClick={() => onAction(a)}>
      {busy === a ? <Loader2 className="animate-spin" /> : <Icon />}
      {busy === a ? (a === "check" ? "Checking…" : "Working…") : label}
    </Button>
  );
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {btn("draft", "Generate Draft", Wand2)}
      {btn("improve", "Improve", Sparkles, !hasText)}
      {btn("shorten", "Shorten", Minimize2, !hasText)}
      {btn("check", "Check Requirement", ListChecks, !hasText)}
      {canUndo && (
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!!busy}>
          <Undo2 /> Undo AI change
        </Button>
      )}
    </div>
  );
}
