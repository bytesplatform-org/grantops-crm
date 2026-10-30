import { useId } from "react";

/** Smooth decorative sparkline with a soft fill underneath. */
export function Sparkline({ values, color, width = 96, height = 40 }: { values: number[]; color: string; width?: number; height?: number }) {
  const id = useId();
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 8)] as const);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={d} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/** Rising bar strip for the dark featured card. */
export function MiniBars({ values, width = 64, height = 40 }: { values: number[]; width?: number; height?: number }) {
  const max = Math.max(...values, 1);
  const gap = 3;
  const w = (width - gap * (values.length - 1)) / values.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * height);
        return <rect key={i} x={i * (w + gap)} y={height - h} width={w} height={h} rx={1.5} fill={i === values.length - 1 ? "#d4d4d8" : "#52525b"} />;
      })}
    </svg>
  );
}

/** Semicircle gauge with the percentage in the middle. */
export function Gauge({ value, size = 88 }: { value: number; size?: number }) {
  const r = size / 2 - 7;
  const c = Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const arc = `M7,${size / 2} A${r},${r} 0 0 1 ${size - 7},${size / 2}`;
  return (
    <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
      <path d={arc} stroke="#e4e4e7" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d={arc} stroke="#c8f03c" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
      <text x={size / 2} y={size / 2 + 2} textAnchor="middle" fontSize={15} fontWeight={700} fill="#18181b">
        {v}%
      </text>
    </svg>
  );
}
