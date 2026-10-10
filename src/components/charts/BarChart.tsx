interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 160,
  maxValue,
}) => {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(12, Math.min(40, (height - 40) / data.length));
  const gap = 8;
  const totalWidth = data.length * (barWidth + gap) - gap;
  const svgWidth = Math.max(totalWidth, 100);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${svgWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const barH = max > 0 ? (d.value / max) * (height - 28) : 0;
        const x = i * (barWidth + gap);
        const y = height - 8 - barH;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={d.color || 'var(--gp-accent)'}
              style={{ transition: 'height 0.3s ease, y 0.3s ease' }}
            />
            <text x={x + barWidth / 2} y={height - 8 + 12} textAnchor="middle" fill="var(--gp-text-tertiary)" fontSize="0.6rem">
              {d.label}
            </text>
            {barH > 0 && (
              <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fill="var(--gp-text-primary)" fontSize="0.6rem" fontWeight={600}>
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
