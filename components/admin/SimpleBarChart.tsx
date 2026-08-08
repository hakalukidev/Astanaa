"use client";

type SimpleBarChartProps = {
  data: { label: string; count: number }[];
  height?: number;
};

/**
 * Small dependency-free bar chart (plain flexbox/CSS) — enough for the admin
 * panel's "signups over time" views without pulling in a charting library.
 */
export default function SimpleBarChart({ data, height = 200 }: SimpleBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/50 py-14 text-sm text-blue-500">
        No signups yet.
      </div>
    );
  }

  const maxCount = Math.max(1, ...data.map((point) => point.count));

  return (
    <div className="w-full">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((point, index) => {
          const barHeightPct = (point.count / maxCount) * 100;

          return (
            <div
              key={`${point.label}-${index}`}
              className="flex h-full flex-1 flex-col items-center justify-end"
              title={`${point.label}: ${point.count}`}
            >
              {point.count > 0 && (
                <span className="mb-1 text-[10px] font-semibold text-blue-700">{point.count}</span>
              )}
              <div
                className="w-full min-w-[2px] rounded-t bg-blue-600 transition-all"
                style={{ height: point.count > 0 ? `${Math.max(barHeightPct, 3)}%` : "1px" }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1 border-t border-blue-100 pt-1.5">
        {data.map((point, index) => (
          <div
            key={`${point.label}-${index}`}
            className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-[10px] text-blue-400"
          >
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
}
