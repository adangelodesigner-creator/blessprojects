interface DoughnutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  size = 160,
  thickness = 20,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segments = data.map((d) => {
    const segLen = total > 0 ? (d.value / total) * circ : 0;
    const seg = { ...d, dashArray: `${segLen} ${circ - segLen}`, dashOffset: -offset };
    offset += segLen;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gp-surface-hover)" strokeWidth={thickness} />
      {segments.map((seg) => (
        <circle
          key={seg.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={thickness}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--gp-text-primary)" fontSize="1.1rem" fontWeight={700}>
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--gp-text-tertiary)" fontSize="0.65rem">
        total
      </text>
    </svg>
  );
};
