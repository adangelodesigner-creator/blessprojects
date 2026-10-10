import type { Project, Task, Settings } from '../types';

export interface LocalSnapshot {
  projects: Project[];
  tasks: Task[];
  settings: Settings | null;
}

const DEFAULT_SETTINGS: Settings = {
  googleCalendarUrl: '',
};

/** Normaliza datos viejos de localStorage al modelo enriquecido actual. */
export function normalizeLocalData(raw: {
  projects?: any[]; tasks?: any[]; settings?: any;
}): LocalSnapshot {
  const projects: Project[] = (raw.projects ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? 'Proyecto',
    description: p.description ?? '',
    color: p.color ?? '#FF6B00',
    client: p.client ?? '',
    status: p.status ?? 'active',
    startDate: p.startDate ?? '',
    dueDate: p.dueDate ?? '',
    notes: p.notes ?? '',
    links: Array.isArray(p.links) ? p.links : [],
    objectives: Array.isArray(p.objectives) ? p.objectives : [],
    userId: p.userId ?? '',
    sharedWith: Array.isArray(p.sharedWith) ? p.sharedWith : [],
    createdAt: p.createdAt ?? new Date().toISOString(),
  }));

  const tasks: Task[] = (raw.tasks ?? []).map((t) => ({
    id: t.id,
    projectId: t.projectId,
    title: t.title ?? '',
    description: t.description ?? '',
    status: t.status ?? 'todo',
    priority: t.priority ?? 'medium',
    dueDate: t.dueDate ?? '',
    tags: Array.isArray(t.tags) ? t.tags : [],
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    createdAt: t.createdAt ?? new Date().toISOString(),
  }));

  const settings: Settings | null = raw.settings
    ? { ...DEFAULT_SETTINGS, ...raw.settings }
    : null;

  return { projects, tasks, settings };
}

/** Lee el snapshot actual del localStorage del navegador. */
export function readLocalSnapshot(): LocalSnapshot {
  const parse = (k: string) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : undefined; }
    catch { return undefined; }
  };
  return normalizeLocalData({
    projects: parse('gp_projects'),
    tasks: parse('gp_tasks'),
    settings: parse('gp_settings'),
  });
}

/** Normaliza un objeto ya parseado (usado por el import de respaldo JSON). */
export function readLocalSnapshotFrom(parsed: any): LocalSnapshot {
  return normalizeLocalData({
    projects: parsed.projects,
    tasks: parsed.tasks,
    settings: parsed.settings,
  });
}
