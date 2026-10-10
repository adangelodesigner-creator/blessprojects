import { useMemo } from 'react';
import type { Project, Task } from '../types';
import { BarChart } from './charts/BarChart';
import { DoughnutChart } from './charts/DoughnutChart';

interface AnalyticsDashboardProps {
  projects: Project[];
  tasks: Task[];
}

function getWeekId(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(d);
  mon.setDate(d.getDate() - diff);
  const y = mon.getFullYear();
  const jan1 = new Date(y, 0, 1);
  const days = Math.floor((mon.getTime() - jan1.getTime()) / 86400000);
  const weekNum = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${y}-W${String(weekNum).padStart(2, '0')}`;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projects,
  tasks,
}) => {

  const tasksCompletedPerWeek = useMemo(() => {
    const weeks: Record<string, number> = {};
    const today = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      weeks[getWeekId(d)] = 0;
    }
    tasks
      .filter((t) => t.status === 'done' && t.createdAt)
      .forEach((t) => {
        const w = getWeekId(new Date(t.createdAt));
        if (w in weeks) weeks[w]++;
      });
    const entries = Object.entries(weeks);
    return entries.map(([w, v]) => ({ label: w.slice(-2), value: v }));
  }, [tasks]);

  const projectStatusData = useMemo(() => {
    const active = projects.filter((p) => p.status === 'active').length;
    const paused = projects.filter((p) => p.status === 'paused').length;
    const done = projects.filter((p) => p.status === 'done').length;
    return [
      { label: 'Activos', value: active, color: 'var(--gp-green)' },
      { label: 'En pausa', value: paused, color: 'var(--gp-yellow)' },
      { label: 'Terminados', value: done, color: 'var(--gp-text-secondary)' },
    ];
  }, [projects]);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics</h2>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Tareas completadas por semana</h4>
          <BarChart data={tasksCompletedPerWeek} />
        </div>

        <div className="analytics-card">
          <h4>Estado de proyectos</h4>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DoughnutChart data={projectStatusData} />
          </div>
          <div className="analytics-legend">
            {projectStatusData.map((d) => (
              <div key={d.label} className="legend-item">
                <span className="legend-dot" style={{ background: d.color }} />
                {d.label} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
