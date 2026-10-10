import React from 'react';

const SkeletonRow = ({ width = '100%', height = 16, style }: {
  width?: string | number; height?: number; style?: React.CSSProperties;
}) => (
  <div className="skeleton-row" style={{
    width, height, ...style,
  }} />
);

export const StatCardSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div className="stat-card" style={{ pointerEvents: 'none', animationDelay: `${delay}s` }}>
    <div className="stat-card-top">
      <SkeletonRow width={34} height={34} style={{ borderRadius: '6px' }} />
    </div>
    <SkeletonRow width="60%" height={28} style={{ marginBottom: '4px' }} />
    <SkeletonRow width="40%" height={14} />
  </div>
);

export const ProjectCardSkeleton = () => (
  <div className="project-card" style={{ pointerEvents: 'none' }}>
    <SkeletonRow height={4} style={{ borderRadius: '2px', marginBottom: '8px' }} />
    <SkeletonRow width="70%" height={18} style={{ marginBottom: '8px' }} />
    <SkeletonRow width="90%" height={14} style={{ marginBottom: '16px' }} />
    <SkeletonRow height={4} style={{ borderRadius: '2px', marginBottom: '8px' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <SkeletonRow width="40%" height={12} />
      <SkeletonRow width="30%" height={12} />
    </div>
  </div>
);
