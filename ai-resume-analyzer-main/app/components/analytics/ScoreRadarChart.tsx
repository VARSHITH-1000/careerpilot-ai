/** Lightweight SVG radar for category scores (no external chart lib). */

type Props = {
  labels: string[];
  values: number[];
  stroke?: string;
  fill?: string;
};

const RAD = Math.PI / 180;

export default function ScoreRadarChart({
  labels,
  values,
  stroke = "#6366f1",
  fill = "rgba(99, 102, 241, 0.18)",
}: Props) {
  const cx = 160;
  const cy = 160;
  const R = 100;
  const n = Math.min(labels.length, values.length);
  if (n < 3) return null;

  function point(i: number, radius: number) {
    const angle = RAD * ((-90 + i * (360 / n)) % 360);
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }

  const grid = [25, 50, 75, 100].map((pct) => {
    const r = (R * pct) / 100;
    const pts = Array.from({ length: n }, (_, i) => point(i, r).join(",")).join(" ");
    return <polygon key={pct} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={1} points={pts} />;
  });

  const poly = Array.from({ length: n }, (_, i) => {
    const clamped = Math.max(0, Math.min(100, values[i] ?? 0));
    const r = (R * clamped) / 100;
    return point(i, r).join(",");
  }).join(" ");

  const anchors = labels.map((label, i) => {
    const [lx, ly] = point(i, R + 28);
    return (
      <text
        key={label}
        x={lx}
        y={ly}
        fontSize={11}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-current opacity-80"
      >
        {label.length > 18 ? `${label.slice(0, 16)}…` : label}
      </text>
    );
  });

  return (
    <figure className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 320 320"
        className="mx-auto max-w-full h-auto text-slate-500 dark:text-slate-400"
        aria-label="Category score radar"
      >
        {grid}
        <polygon fill={fill} stroke={stroke} strokeWidth={2} points={poly} strokeLinejoin="round" />
        {anchors}
      </svg>
    </figure>
  );
}
