import { CheckCircle2, CircleAlert, X } from "lucide-react";
import type { RequirementCheck } from "@/lib/ai-service";
import { ScoreRing } from "@/components/shared/score-ring";

export function RequirementResult({ result, onClose }: { result: RequirementCheck; onClose: () => void }) {
  return (
    <div className="relative rounded-lg border border-border bg-muted/40 p-4">
      <button onClick={onClose} className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-card" aria-label="Dismiss requirement check">
        <X className="size-3.5" />
      </button>
      <div className="flex gap-4">
        <ScoreRing score={result.score} size={52} />
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Requirement coverage</div>
            <ul className="space-y-1">
              {result.met.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
              {result.met.map((m) => (
                <li key={m} className="flex gap-1.5 text-xs text-slate-700">
                  <CheckCircle2 className="mt-px size-3.5 shrink-0 text-emerald-600" /> {m}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Gaps to address</div>
            <ul className="space-y-1">
              {result.gaps.length === 0 && <li className="text-xs text-muted-foreground">No gaps found.</li>}
              {result.gaps.map((g) => (
                <li key={g} className="flex gap-1.5 text-xs text-slate-700">
                  <CircleAlert className="mt-px size-3.5 shrink-0 text-amber-600" /> {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Automated check against the NOFO requirement — final review by a grant professional is still required.</p>
    </div>
  );
}
