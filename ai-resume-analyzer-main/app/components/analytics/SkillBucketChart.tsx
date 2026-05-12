type Bucket = NonNullable<Feedback["hybrid"]>["skillDistribution"][number];

/** Horizontal bars showing how many toolkit items were surfaced per bucket. */

export default function SkillBucketChart({ buckets }: { buckets: Bucket[] }) {
  if (!buckets?.length) {
    return <p className="text-sm text-gray-500">No skill buckets — run deterministic scoring on richer PDF text.</p>;
  }

  const max = Math.max(...buckets.map((b) => b.matched.length), 1);

  return (
    <div className="space-y-3">
      {buckets.map((b) => {
        const pct = Math.round((b.matched.length / max) * 100);
        return (
          <div key={b.label} className="space-y-1">
            <div className="flex justify-between text-sm text-gray-700">
              <span className="font-medium capitalize">{b.label}</span>
              <span className="text-gray-500">
                {b.matched.length} match{b.matched.length === 1 ? "" : "es"}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{ width: `${pct}%`, minWidth: b.matched.length ? "8px" : 0 }}
              />
            </div>
            {b.matched.length > 0 ? (
              <p className="text-xs text-gray-500 truncate" title={b.matched.join(", ")}>
                {b.matched.slice(0, 6).join(", ")}
                {b.matched.length > 6 ? " …" : ""}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
