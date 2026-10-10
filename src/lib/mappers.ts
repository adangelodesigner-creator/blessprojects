import type {
  Project, Task, Settings, ProjectLink, ProjectFile, Invoice, Profile,
} from '../types';

// ---- Project ----
export function rowToProject(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    color: r.color ?? '#FF6B00',
    client: r.client ?? '',
    status: r.status ?? 'active',
    startDate: r.start_date ?? '',
    dueDate: r.due_date ?? '',
    notes: r.notes ?? '',
    links: Array.isArray(r.links) ? (r.links as ProjectLink[]) : [],
    objectives: Array.isArray(r.objectives) ? r.objectives : [],
    userId: r.user_id,
    sharedWith: Array.isArray(r.shared_with) ? r.shared_with : [],
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export function projectToRow(p: Project, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    description: p.description,
    color: p.color,
    client: p.client,
    status: p.status,
    start_date: p.startDate === '' ? null : p.startDate,
    due_date: p.dueDate === '' ? null : p.dueDate,
    notes: p.notes,
    links: p.links,
    objectives: p.objectives,
    shared_with: p.sharedWith,
    created_at: p.createdAt,
  };
}

// ---- Task ----
export function rowToTask(r: any): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description ?? '',
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date ?? '',
    tags: Array.isArray(r.tags) ? r.tags : [],
    subtasks: Array.isArray(r.subtasks) ? r.subtasks : [],
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export function taskToRow(t: Task, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    project_id: t.projectId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate === '' ? null : t.dueDate,
    tags: t.tags,
    subtasks: t.subtasks,
    created_at: t.createdAt,
  };
}

// ---- Settings ----
export function rowToSettings(r: any): Settings {
  return {
    googleCalendarUrl: r.google_calendar_url ?? '',
  };
}

export function settingsToRow(s: Settings, userId: string) {
  return {
    user_id: userId,
    google_calendar_url: s.googleCalendarUrl,
  };
}

// ---- ProjectFile ----
// ---- Invoice ----
export function rowToInvoice(r: any): Invoice {
  return {
    id: r.id,
    projectId: r.project_id,
    month: r.month,
    items: Array.isArray(r.items) ? r.items : [],
    total: r.total,
    status: r.status,
    paidAt: r.paid_at ?? null,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export function invoiceToRow(inv: Invoice, userId: string) {
  return {
    id: inv.id,
    user_id: userId,
    project_id: inv.projectId,
    month: inv.month,
    items: inv.items,
    total: inv.total,
    status: inv.status,
    paid_at: inv.paidAt,
    created_at: inv.createdAt,
  };
}

// ---- Profile ----
export function rowToProfile(r: any): Profile {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name ?? '',
    role: r.role ?? 'brother',
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export function rowToProjectFile(r: any): ProjectFile {
  return {
    id: r.id,
    projectId: r.project_id,
    fileName: r.file_name,
    storagePath: r.storage_path,
    sizeBytes: r.size_bytes ?? 0,
    mimeType: r.mime_type ?? '',
    uploadedAt: r.uploaded_at ?? new Date().toISOString(),
  };
}
