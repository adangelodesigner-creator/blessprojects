interface LineChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 160,
}) => {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const padX = 8;
  const chartW = 100 - padX * 2;
  const chartH = height - 28;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = height - 8 - (d.value / maxVal) * chartH;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const areaPoints = `${padX},${height - 8} ${polyline} ${padX + chartW},${height - 8}`;

  const color = data[0]?.color || 'var(--gp-accent)';

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="xMidYMid meet">
      <polygon points={areaPoints} fill={color} fillOpacity={0.1} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => {
        const x = padX + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = height - 8 - (d.value / maxVal) * chartH;
        return (
          <g key={d.label}>
            <circle cx={x} cy={y} r={3} fill={color} stroke="var(--gp-surface)" strokeWidth={1.5} />
            <text x={x} y={height - 8 + 12} textAnchor="middle" fill="var(--gp-text-tertiary)" fontSize="0.55rem">
              {d.label}
            </text>
            <text x={x} y={y - 6} textAnchor="middle" fill="var(--gp-text-primary)" fontSize="0.55rem" fontWeight={600}>
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
