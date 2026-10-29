import { cn } from "@/lib/utils";

export function scoreColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#64748b";
  return "#dc2626";
}

export function ScoreRing({ score, size = 56, stroke = 5, className, label = true }: { score: number; size?: number; stroke?: number; className?: string; label?: boolean }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ecf2" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} className="transition-all duration-700" />
      </svg>
      {label && (
        <span className="absolute text-center font-semibold tabular" style={{ fontSize: size * 0.27, color }}>
          {score}
          <span style={{ fontSize: size * 0.16 }}>%</span>
        </span>
      )}
    </div>
  );
}

export function ScoreBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70", className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: scoreColor(value) }} />
    </div>
  );
}
