'use client';

import { TimelinePoint } from '@/lib/types';

export function LineChart(props: { points: TimelinePoint[] }) {
  const width = 940;
  const height = 260;
  const padding = 28;

  if (!props.points.length) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-[var(--muted)]">No timeline data.</div>;
  }

  const max = Math.max(...props.points.map((point) => point.count), 1);
  const min = Math.min(...props.points.map((point) => point.count), 0);
  const range = Math.max(max - min, 1);

  const coordinates = props.points.map((point, index) => {
    const x = padding + (index / Math.max(props.points.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (point.count - min) / range) * (height - padding * 2);
    return { x, y, label: point.label, count: point.count };
  });

  const path = coordinates.map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x} ${coord.y}`).join(' ');
  const areaPath = `${path} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full min-w-[640px]">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#3da8ff" />
            <stop offset="100%" stopColor="#2ce2b2" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(61,168,255,0.28)" />
            <stop offset="100%" stopColor="rgba(44,226,178,0.03)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={path} fill="none" stroke="url(#lineGradient)" strokeWidth={3} />
        {coordinates
          .map((coord, index) => ({ coord, index }))
          .filter((entry) => entry.index % Math.ceil(coordinates.length / 10) === 0)
          .map((entry) => (
          <g key={`${entry.coord.x}-${entry.coord.y}-${entry.index}`}>
            <circle cx={entry.coord.x} cy={entry.coord.y} r={3} fill="#2ce2b2" />
            <title>{`${props.points[entry.index]?.label || ''}: ${props.points[entry.index]?.count || 0}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
