# Gestorprojects v2: Redesign UI + Backend Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign UI to modern Linear-style, refactor backend (db.ts + MCP server), add analytics dashboard

**Architecture:** Progressive CSS overhaul with design system tokens, component-by-component refactor, SVGs for analytics charts. MCP server split into modules with Zod validation.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Supabase, MCP SDK, Zod

**Spec:** `docs/superpowers/specs/2026-07-18-gestorprojects-redesign.md`

---

# Phase 1 — Design System: CSS tokens + index.css overhaul

## Task 1.1 — New CSS custom properties

**Files:**
- Modify: `src/index.css:1-65`

**Step 1: Replace root variables with new design tokens**

Replace the current `:root` block (lines 1-65) with new tokens:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --gp-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --gp-font-mono: 'JetBrains Mono', monospace;
  --gp-duration: 150ms;
  --gp-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --gp-radius-sm: 6px;
  --gp-radius-md: 10px;
  --gp-radius-lg: 14px;
  --gp-radius-xl: 20px;
  --gp-radius-full: 9999px;
  --gp-space-1: 4px;
  --gp-space-2: 8px;
  --gp-space-3: 12px;
  --gp-space-4: 16px;
  --gp-space-5: 20px;
  --gp-space-6: 24px;
  --gp-space-8: 32px;
  --gp-space-10: 40px;
  --gp-text-xs: 0.7rem;
  --gp-text-sm: 0.8rem;
  --gp-text-base: 0.88rem;
  --gp-text-lg: 1rem;
  --gp-text-xl: 1.2rem;
  --gp-text-2xl: 1.5rem;
  --gp-text-3xl: 2rem;
}

html, body.dark-theme {
  --gp-bg: #0B0B0F;
  --gp-surface: #141417;
  --gp-surface-hover: #1C1C21;
  --gp-surface-active: #222228;
  --gp-border: #232329;
  --gp-border-hover: #34343C;
  --gp-text-primary: #EDEDEF;
  --gp-text-secondary: #868690;
  --gp-text-tertiary: #5E5E6B;
  --gp-accent: #F97316;
  --gp-accent-hover: #EA580C;
  --gp-accent-subtle: rgba(249, 115, 22, 0.08);
  --gp-accent-ring: rgba(249, 115, 22, 0.25);
  --gp-accent-glow: 0 0 20px rgba(249, 115, 22, 0.15);
  --gp-green: #22C55E;
  --gp-green-bg: rgba(34, 197, 94, 0.1);
  --gp-blue: #3B82F6;
  --gp-blue-bg: rgba(59, 130, 246, 0.1);
  --gp-red: #EF4444;
  --gp-red-bg: rgba(239, 68, 68, 0.1);
  --gp-yellow: #EAB308;
  --gp-yellow-bg: rgba(234, 179, 8, 0.1);
  --gp-shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --gp-shadow-sm: 0 2px 8px rgba(0,0,0,0.35);
  --gp-shadow-md: 0 4px 16px rgba(0,0,0,0.4);
  --gp-shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
  --gp-shadow-glow: 0 0 24px rgba(249,115,22,0.08);
}

body.light-theme {
  --gp-bg: #F5F5F7;
  --gp-surface: #FFFFFF;
  --gp-surface-hover: #F0F0F2;
  --gp-surface-active: #E8E8EC;
  --gp-border: #E3E3E8;
  --gp-border-hover: #C7C7D0;
  --gp-text-primary: #0B0B0F;
  --gp-text-secondary: #6B6B78;
  --gp-text-tertiary: #9E9EA8;
  --gp-accent: #EA580C;
  --gp-accent-hover: #C2410C;
  --gp-accent-subtle: rgba(234, 88, 12, 0.08);
  --gp-accent-ring: rgba(234, 88, 12, 0.2);
  --gp-green: #16A34A;
  --gp-green-bg: rgba(22, 163, 74, 0.08);
  --gp-blue: #2563EB;
  --gp-blue-bg: rgba(37, 99, 235, 0.08);
  --gp-red: #DC2626;
  --gp-red-bg: rgba(220, 38, 38, 0.08);
  --gp-yellow: #CA8A04;
  --gp-yellow-bg: rgba(202, 138, 4, 0.08);
  --gp-shadow-xs: 0 1px 3px rgba(11,11,15,0.06);
  --gp-shadow-sm: 0 2px 8px rgba(11,11,15,0.08);
  --gp-shadow-md: 0 4px 16px rgba(11,11,15,0.1);
  --gp-shadow-lg: 0 8px 32px rgba(11,11,15,0.12);
  --gp-shadow-glow: 0 0 24px rgba(234,88,12,0.06);
}
```

**Step 2: Rename all `var(--xyz)` references in the rest of index.css**

Replace throughout the file:
- `var(--bg-app)` → `var(--gp-bg)`
- `var(--bg-card)` → `var(--gp-surface)`
- `var(--bg-hover)` → `var(--gp-surface-hover)`
- `var(--bg-active)` → `var(--gp-surface-active)`
- `var(--border)` → `var(--gp-border)`
- `var(--border-hover)` → `var(--gp-border-hover)`
- `var(--text-main)` → `var(--gp-text-primary)`
- `var(--text-muted)` → `var(--gp-text-secondary)`
- `var(--text-light)` → `var(--gp-text-tertiary)`
- `var(--accent)` → `var(--gp-accent)`
- `var(--accent-hover)` → `var(--gp-accent-hover)`
- `var(--accent-bg)` → `var(--gp-accent-subtle)`
- `var(--accent-ring)` → `var(--gp-accent-ring)`
- `var(--green)` → `var(--gp-green)`
- `var(--green-bg)` → `var(--gp-green-bg)`
- `var(--red)` → `var(--gp-red)`
- `var(--red-bg)` → `var(--gp-red-bg)`
- `var(--blue)` → `var(--gp-blue)`
- `var(--blue-bg)` → `var(--gp-blue-bg)`
- `var(--yellow)` → `var(--gp-yellow)`
- `var(--yellow-bg)` → `var(--gp-yellow-bg)`
- `var(--shadow-sm)` → `var(--gp-shadow-sm)`
- `var(--shadow-md)` → `var(--gp-shadow-md)`
- `var(--shadow-lg)` → `var(--gp-shadow-lg)`
- `var(--font-sans)` → `var(--gp-font-sans)`
- `var(--font-mono)` → `var(--gp-font-mono)`
- `var(--transition)` → `var(--gp-duration) var(--gp-ease)`
- `var(--radius-sm)` → `var(--gp-radius-sm)`
- `var(--radius-md)` → `var(--gp-radius-md)`
- `var(--radius-lg)` → `var(--gp-radius-lg)`

**Step 3: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(design): add design system CSS custom properties"
```

## Task 1.2 — Replace inline styles in all components

**Files:**
- Modify: All files in `src/components/*.tsx` (21 files)
- Also: `src/App.tsx`

**Step 1: Audit and migrate**

Search for `style={{` across all components. Replace common patterns:
- Inline color: `style={{ color: 'var(--text-muted)' }}` → use class
- Inline spacing: `style={{ marginBottom: '1rem' }}` → use `--gp-space-*` tokens via className
- Inline backgrounds: `style={{ background: 'var(--bg-card)' }}` → use class

Replace with semantic classNames. Only keep inline styles for truly dynamic values (e.g., `project.color`).

**Step 2: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 3: Commit**

```bash
git add src/
git commit -m "refactor(ui): replace inline styles with design tokens"
```

---

# Phase 2 — Core Components Overhaul

## Task 2.1 — Sidebar redesign

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/index.css` (sidebar section, lines 96-177)

**Step 1: Rewrite sidebar section CSS**

Replace `.sidebar`, `.sidebar-header`, `.sidebar-logo`, `.sidebar-nav-item`, `.sidebar-project-item`, `.sidebar-footer` styles with new look:
- Active nav item: left accent bar instead of background
- Logo: gradient icon with glow
- Project dots: larger, with subtle ring
- Footer: clean divider with theme toggle
- Collapse: smooth width transition

New CSS:
```css
.sidebar {
  width: 240px; background: var(--gp-surface);
  border-right: 1px solid var(--gp-border);
  position: fixed; top: 0; left: 0; bottom: 0;
  display: flex; flex-direction: column;
  z-index: 100; transition: width var(--gp-duration) var(--gp-ease);
  overflow: hidden;
}
.sidebar.collapsed { width: 56px; }
.sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--gp-space-4) var(--gp-space-3); min-height: 57px;
  border-bottom: 1px solid var(--gp-border);
}
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  font-weight: 800; font-size: 1rem; letter-spacing: -0.02em;
  color: var(--gp-text-primary); white-space: nowrap; overflow: hidden;
}
.sidebar-logo-icon {
  width: 22px; height: 22px; border-radius: 6px;
  background: linear-gradient(135deg, var(--gp-accent), var(--gp-accent-hover));
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  color: white; font-size: 11px; font-weight: 800;
  box-shadow: var(--gp-shadow-glow);
}
.sidebar-nav { padding: var(--gp-space-2); display: flex; flex-direction: column; gap: 1px; }
.sidebar-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: var(--gp-radius-sm);
  font-size: var(--gp-text-sm); font-weight: 500; color: var(--gp-text-secondary);
  cursor: pointer; transition: all var(--gp-duration) var(--gp-ease);
  border: none; background: none; width: 100%; text-align: left;
  white-space: nowrap; position: relative;
}
.sidebar-nav-item:hover { background: var(--gp-surface-hover); color: var(--gp-text-primary); }
.sidebar-nav-item.active {
  color: var(--gp-accent); font-weight: 600;
  background: var(--gp-accent-subtle);
}
.sidebar-nav-item.active::before {
  content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 18px; border-radius: 0 3px 3px 0;
  background: var(--gp-accent);
}
.sidebar-nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
```

(Continue with similar updates for `.sidebar-project-item`, `.sidebar-footer`, `.theme-toggle`)

**Step 2: Update Sidebar.tsx component**

Add active indicator bar with left border. Add project count badge. Clean up the JSX.

**Step 3: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/index.css
git commit -m "feat(ui): redesign sidebar with active indicators and glow"
```

## Task 2.2 — Dashboard redesign

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/index.css` (stats row, project grid, sections)

**Step 1: Rewrite Dashboard CSS**

- Stats cards: glass effect with `backdrop-filter`, subtle border glow on hover
- Project cards: elevation on hover, accent bar with gradient
- Section headers: larger, with subtle underline

**Step 2: Update stats row**

Replace stat card rendering with cleaner cards with icon backgrounds and value glow.

**Step 3: Update project cards**

Each card gets: accent bar (gradient), status badge with icon, progress bar with gradient fill, deadline indicator.

**Step 4: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/index.css
git commit -m "feat(ui): redesign dashboard with glass stats and elevated cards"
```

## Task 2.3 — ProjectDetails redesign (List + Kanban)

**Files:**
- Modify: `src/components/ProjectDetails.tsx`
- Modify: `src/index.css` (kanban, list view)

**Step 1: Redesign Kanban columns**

- Column headers: gradient background strip, cleaner count badges
- Cards: subtle border, hover elevation, priority dot with glow
- Drag feedback: dashed placeholder

**Step 2: Redesign List view rows**

- Group headers: left accent border
- Rows: cleaner select inputs, inline calendar link with icon
- Status pills: colored dots + text

**Step 3: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 4: Commit**

```bash
git add src/components/ProjectDetails.tsx src/index.css
git commit -m "feat(ui): redesign kanban and list views"
```

## Task 2.4 — Modals redesign (glassmorphism)

**Files:**
- Modify: `src/components/Modals.tsx`
- Modify: `src/index.css` (modals section)

**Step 1: Update modal CSS**

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.12s ease-out;
}
.modal-content {
  background: var(--gp-surface);
  width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--gp-border);
  border-radius: var(--gp-radius-lg);
  box-shadow: var(--gp-shadow-lg), var(--gp-shadow-glow);
  animation: slideIn 0.18s var(--gp-ease);
}
.modal-header {
  padding: var(--gp-space-4) var(--gp-space-5); border-bottom: 1px solid var(--gp-border);
  display: flex; justify-content: space-between; align-items: center;
  background: linear-gradient(180deg, var(--gp-surface), transparent);
}
.modal-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 3px; background: linear-gradient(90deg, var(--gp-accent), var(--gp-accent-hover));
  border-radius: var(--gp-radius-lg) var(--gp-radius-lg) 0 0;
}
```

**Step 2: Update ProjectModal form**
- Color selector: larger dots with ring
- Fields: cleaner focus states with glow

**Step 3: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 4: Commit**

```bash
git add src/components/Modals.tsx src/index.css
git commit -m "feat(ui): glassmorphism modals with accent bar"
```

---

# Phase 3 — Remaining Components

## Task 3.1 — ProjectInfoPanel + ProjectFiles

**Files:**
- Modify: `src/components/ProjectInfoPanel.tsx`
- Modify: `src/components/ProjectFiles.tsx`

**Step 1: Update InfoPanel**

- Objectives: progress bar with gradient, check icons
- Notes: textarea with border focus glow
- Links: card-style with favicon-style icon
- Status selector: colored pill

**Step 2: Update ProjectFiles**

- Upload area: dashed drop zone
- File rows: icon, name, size, download/delete buttons
- Empty state: illustration

**Step 3: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 4: Commit**

```bash
git add src/components/ProjectInfoPanel.tsx src/components/ProjectFiles.tsx
git commit -m "feat(ui): redesign info panel and files section"
```

## Task 3.2 — Calendar + Pomodoro + Settings + Outreach

**Files:**
- Modify: `src/components/CalendarView.tsx`
- Modify: `src/components/PomodoroTimer.tsx`
- Modify: `src/components/Settings.tsx`
- Modify: `src/components/Outreach.tsx`

**Step 1: Update each component with new design tokens**

Replace inline styles, use semantic classes.

**Step 2: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 3: Commit**

```bash
git add src/components/CalendarView.tsx src/components/PomodoroTimer.tsx src/components/Settings.tsx src/components/Outreach.tsx
git commit -m "feat(ui): redesign calendar, pomodoro, settings and outreach"
```

---

# Phase 4 — Analytics Dashboard (SVG charts)

## Task 4.1 — SVG chart components

**Files:**
- Create: `src/components/charts/DoughnutChart.tsx`
- Create: `src/components/charts/BarChart.tsx`
- Create: `src/components/charts/LineChart.tsx`

**Step 1: Create DoughnutChart component**

```tsx
interface DoughnutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data, size = 120, thickness = 20,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d) => {
        const pct = d.value / total;
        const length = pct * circumference;
        const dash = `${length} ${circumference - length}`;
        const seg = (
          <circle
            key={d.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        );
        offset += length;
        return seg;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="1.2rem"
        fontWeight={700} fill="var(--gp-text-primary)">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="0.6rem"
        fill="var(--gp-text-secondary)">
        total
      </text>
    </svg>
  );
};
```

**Step 2: Create BarChart component**

```tsx
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data, height = 180, maxValue,
}) => {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const w = Math.max(20, Math.min(50, 600 / data.length));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * (w + 8)} ${height}`}
      style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 24);
        const x = i * (w + 8);
        const y = height - 12 - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={w} height={barH} rx={4}
              fill={d.color ?? 'var(--gp-accent)'}
              style={{ transition: 'height 0.3s ease' }} />
            <text x={x + w / 2} y={height - 2} textAnchor="middle"
              fontSize="0.6rem" fill="var(--gp-text-tertiary)">
              {d.label}
            </text>
            <text x={x + w / 2} y={y - 4} textAnchor="middle"
              fontSize="0.65rem" fontWeight={600} fill="var(--gp-text-primary)">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
```

**Step 3: Create LineChart component** (similar SVG approach)

**Step 4: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 5: Commit**

```bash
git add src/components/charts/
git commit -m "feat(analytics): SVG chart components (doughnut, bar, line)"
```

## Task 4.2 — AnalyticsDashboard component

**Files:**
- Create: `src/components/AnalyticsDashboard.tsx`
- Modify: `src/components/Dashboard.tsx` (integrate)
- Modify: `src/services/db.ts` (add query helpers)

**Step 1: Create AnalyticsDashboard**

This component receives tasks, sessions, invoices, projects and computes:
- Tasks completed per week (last 8 weeks) → BarChart
- Focus hours per day (last 14 days) → BarChart
- Project status distribution → DoughnutChart
- Monthly invoice totals → BarChart
- Task completion rate trend → LineChart

```tsx
import { useState, useMemo } from 'react';
import { BarChart, DoughnutChart, LineChart } from './charts';
import type { Project, Task, PomodoroSession, Invoice } from '../types';

interface Props {
  projects: Project[];
  tasks: Task[];
  sessions: PomodoroSession[];
  invoices: Invoice[];
}

type Range = '7d' | '30d' | '90d';

export const AnalyticsDashboard: React.FC<Props> = ({
  projects, tasks, sessions, invoices,
}) => {
  const [range, setRange] = useState<Range>('30d');

  const rangeDays = { '7d': 7, '30d': 30, '90d': 90 }[range];

  // Compute weekly task completions
  const weeklyData = useMemo(() => {
    const weeks: { label: string; value: number; color: string }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const count = tasks.filter((t) => {
        if (t.status !== 'done' || !t.createdAt) return false;
        const d = new Date(t.createdAt);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({
        label: weekStart.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        value: count,
        color: 'var(--gp-accent)',
      });
    }
    return weeks;
  }, [tasks]);

  // Compute project status distribution
  const statusData = useMemo(() => {
    const active = projects.filter((p) => p.status === 'active').length;
    const paused = projects.filter((p) => p.status === 'paused').length;
    const done = projects.filter((p) => p.status === 'done').length;
    return [
      { label: 'Activos', value: active, color: '#22C55E' },
      { label: 'En pausa', value: paused, color: '#EAB308' },
      { label: 'Terminados', value: done, color: '#5E5E6B' },
    ];
  }, [projects]);

  // Compute pomodoro trend
  const pomodoroData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = rangeDays; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const mins = sessions
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + s.minutes, 0);
      days.push({
        label: d.toLocaleDateString('es', { day: 'numeric', month: 'short' }),
        value: Math.round(mins / 60 * 10) / 10,
      });
    }
    return days;
  }, [sessions, rangeDays]);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Analytics</h2>
        <div className="view-toggle-container">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button key={r}
              className={`view-toggle-btn ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Tareas completadas / semana</h4>
          <BarChart data={weeklyData} height={160} />
        </div>
        <div className="analytics-card">
          <h4>Estado de proyectos</h4>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DoughnutChart data={statusData} size={140} thickness={24} />
          </div>
          <div className="analytics-legend">
            {statusData.map((d) => (
              <div key={d.label} className="legend-item">
                <span className="legend-dot" style={{ background: d.color }} />
                <span>{d.label}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="analytics-card">
          <h4>Horas de enfoque / día</h4>
          <BarChart data={pomodoroData} height={160} color="var(--gp-green)" />
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Add analytics CSS**

```css
.analytics-dashboard { margin-top: 28px; }
.analytics-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
}
.analytics-header h2 { font-size: var(--gp-text-xl); font-weight: 700; }
.analytics-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;
}
.analytics-card {
  background: var(--gp-surface); border: 1px solid var(--gp-border);
  border-radius: var(--gp-radius-md); padding: var(--gp-space-5);
}
.analytics-card h4 {
  font-size: var(--gp-text-xs); font-weight: 600; color: var(--gp-text-secondary);
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: var(--gp-space-4);
}
.analytics-legend {
  display: flex; justify-content: center; gap: var(--gp-space-4); margin-top: var(--gp-space-3);
}
.legend-item { display: flex; align-items: center; gap: 6px; font-size: var(--gp-text-xs); color: var(--gp-text-secondary); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
```

**Step 3: Integrate into Dashboard**

Add `<AnalyticsDashboard>` section below the project grid, only when there are projects.

**Step 4: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 5: Commit**

```bash
git add src/components/AnalyticsDashboard.tsx src/components/Dashboard.tsx src/index.css
git commit -m "feat(analytics): add analytics dashboard with SVG charts"
```

---

# Phase 5 — Backend: db.ts refactor

## Task 5.1 — Add typed errors and analytics queries

**Files:**
- Modify: `src/services/db.ts`

**Step 1: Add AppError class**

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION' | 'NETWORK' | 'AUTH' | 'NOT_FOUND' | 'UNKNOWN',
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

**Step 2: Replace throw new Error with AppError**

Throughout db.ts, replace all `throw new Error(...)` with `throw new AppError(...)`.

**Step 3: Add analytics query functions**

```ts
export interface WeeklyCompletion {
  weekStart: string;
  count: number;
}

export async function fetchWeeklyCompletedTasks(userId: string): Promise<WeeklyCompletion[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('created_at')
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('created_at', new Date(Date.now() - 56 * 86400000).toISOString())
    .order('created_at');
  if (error) throw new AppError(error.message, 'NETWORK', true);
  // Aggregate by week in JS
  const weeks: WeeklyCompletion[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const ws = new Date(now);
    ws.setDate(ws.getDate() - i * 7);
    ws.setHours(0, 0, 0, 0);
    const we = new Date(ws);
    we.setDate(we.getDate() + 7);
    const count = (data ?? []).filter((t) => {
      const d = new Date(t.created_at);
      return d >= ws && d < we;
    }).length;
    weeks.push({ weekStart: ws.toISOString().split('T')[0], count });
  }
  return weeks;
}
```

**Step 4: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 5: Commit**

```bash
git add src/services/db.ts
git commit -m "refactor(db): add AppError class and analytics query functions"
```

---

# Phase 6 — MCP Server refactor

## Task 6.1 — Split MCP server into modules

**Files:**
- Create: `src/handlers/projects.ts`
- Create: `src/handlers/tasks.ts`
- Create: `src/handlers/invoices.ts`
- Create: `src/handlers/leads.ts`
- Create: `src/handlers/sessions.ts`
- Create: `src/handlers/profiles.ts`
- Create: `src/handlers/files.ts`
- Create: `src/handlers/dashboard.ts`
- Create: `src/handlers/settings.ts`
- Create: `src/handlers/financial_entries.ts`
- Create: `src/lib/validation.ts`
- Create: `src/lib/logger.ts`
- Modify: `src/index.ts`
- Modify: `src/db.ts`

**Note:** This is a large refactor. Each handler file exports functions that take parameters and return typed results. `src/index.ts` becomes thin: it imports handlers and registers tools.

**Step 1: Create logger**

```ts
// src/lib/logger.ts
export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', msg, meta, ts: new Date().toISOString() })),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', msg, meta, ts: new Date().toISOString() })),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', msg, meta, ts: new Date().toISOString() })),
};
```

**Step 2: Create validation schemas**

```ts
// src/lib/validation.ts
import { z } from 'zod';

export const IdSchema = z.string().min(1, 'ID is required');
export const ProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().default(''),
  color: z.string().default('#FF6B00'),
  client: z.string().default(''),
  status: z.enum(['active', 'paused', 'done']).default('active'),
  startDate: z.string().default(''),
  dueDate: z.string().default(''),
  notes: z.string().default(''),
  links: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })).default([]),
});
export const TaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().default(''),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.object({ id: z.string(), title: z.string(), completed: z.boolean() })).default([]),
});
```

**Step 3: Create handler files**

Each handler exports functions like:
```ts
export async function handleListProjects(): Promise<{ content: { type: string; text: string }[] }>
export async function handleCreateProject(args: unknown): Promise<{ content: { type: string; text: string }[] }>
```

**Step 4: Slim down index.ts**

```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './lib/logger.js';
import * as projects from './handlers/projects.js';
// ... rest of handlers

const server = new Server({ name: 'gestorprojects-mcp', version: '1.0.0' }, {
  capabilities: { tools: {} },
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    ...projects.tools,
    ...tasks.tools,
    // ... all tool definitions
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'gestor_list_projects': return await projects.handleListProjects();
      case 'gestor_create_project': return await projects.handleCreateProject(args);
      // ... all routes
      default: throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Tool ${name} failed`, { error: String(error) });
    return { content: [{ type: 'text', text: `Error: ${error}` }], isError: true };
  }
});
```

**Step 5: Add missing tools**

Add handlers for:
- `gestor_get_settings` / `gestor_update_settings`
- `gestor_list_financial_entries` / `gestor_create_financial_entry` / `gestor_delete_financial_entry`
- `gestor_get_insights`

**Step 6: Build**

Run: `npm run build` (in gestorprojects-mcp directory)
Expected: compiles clean.

**Step 7: Commit**

```bash
git add src/
git commit -m "refactor(mcp): split monolithic server into modules with validation and logging"
```

---

# Phase 7 — Micro-interactions + Polish

## Task 7.1 — Hover animations and transitions

**Files:**
- Modify: `src/index.css`

**Step 1: Add global hover styles**

```css
.gp-hover-lift {
  transition: transform var(--gp-duration) var(--gp-ease), box-shadow var(--gp-duration) var(--gp-ease);
}
.gp-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--gp-shadow-md);
}
.gp-hover-glow:hover {
  box-shadow: var(--gp-shadow-glow);
}
.gp-transition {
  transition: all var(--gp-duration) var(--gp-ease);
}
```

**Step 2: Add loading skeleton refinement**

```css
.gp-skeleton {
  background: linear-gradient(90deg, var(--gp-surface-hover) 0%, var(--gp-surface-active) 50%, var(--gp-surface-hover) 100%);
  background-size: 200% 100%;
  animation: gp-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--gp-radius-sm);
}
@keyframes gp-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Step 3: Build**

Run: `npm run build`
Expected: compiles clean.

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat(ui): micro-interactions, hover animations and skeleton refinement"
```

---

# Phase 8 — Verification

## Task 8.1 — Build verification

**Step 1: Build frontend**

Run: `npm run build` (in Gestorprojects/)
Expected: clean compilation, no errors.

**Step 2: Build MCP server**

Run: `npm run build` (in gestorprojects-mcp/)
Expected: clean compilation, no errors.

**Step 3: Manual verification**

```bash
npm run dev
```

Check:
- [ ] Sidebar renders with new design
- [ ] Dashboard shows analytics section with charts
- [ ] Glass modals work (project + task create/edit)
- [ ] Kanban drag-and-drop works
- [ ] List view renders with new styles
- [ ] Calendar and Pomodoro keep working
- [ ] Settings page renders correctly
- [ ] Mobile responsive works (bottom nav, full-screen modals)
- [ ] No regressions in outreach, finances, admin

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: finalize v2 redesign and backend refactor"
git tag v2.0-redesign
```
