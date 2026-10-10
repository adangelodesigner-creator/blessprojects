import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Project, Task, Settings, ProjectFile, Invoice, Profile } from '../types';

export class AppError extends Error {
  readonly code: 'VALIDATION' | 'NETWORK' | 'AUTH' | 'NOT_FOUND' | 'UNKNOWN';
  readonly retryable: boolean;

  constructor(
    message: string,
    code: 'VALIDATION' | 'NETWORK' | 'AUTH' | 'NOT_FOUND' | 'UNKNOWN',
    retryable: boolean = false,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.retryable = retryable;
  }
}
import {
  rowToProject, projectToRow, rowToTask, taskToRow,
  rowToSettings, settingsToRow, rowToProjectFile,
  rowToInvoice, invoiceToRow, rowToProfile,
} from '../lib/mappers';

// Cache the user ID to avoid repeated auth lookups
let _uidCache: string | null = null;
let _uidPromise: Promise<string> | null = null;

async function uid(): Promise<string> {
  if (_uidCache) return _uidCache;
  if (_uidPromise) return _uidPromise;
  _uidPromise = (async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new AppError('No hay sesión activa', 'AUTH', false);
    _uidCache = data.user.id;
    return data.user.id;
  })();
  try { return await _uidPromise; }
  finally { _uidPromise = null; }
}

export function invalidateUidCache() {
  _uidCache = null;
}

export interface AllData {
  projects: Project[];
  tasks: Task[];
  settings: Settings | null;
  invoices: Invoice[];
  connectionOk: boolean;
}

const RETRY_DELAY = 1000;
const MAX_RETRIES = 2;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (attempt < retries && isTransientError(e)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new AppError('Retry exhausted', 'NETWORK', true);
}

function isTransientError(e: unknown): boolean {
  if (e && typeof e === 'object') {
    const msg = String((e as any).message ?? '');
    return msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') ||
      msg.includes('abort') || msg.includes('502') || msg.includes('503');
  }
  return false;
}

function validateString(v: unknown, label: string): string {
  if (typeof v !== 'string') throw new AppError(`${label}: debe ser texto`, 'VALIDATION', false);
  return v;
}

export async function fetchAllData(): Promise<AllData> {
  if (!isSupabaseConfigured) return { projects: [], tasks: [], settings: null, invoices: [], connectionOk: false };

  let anyError = false;

  const safeQuery = async <T>(label: string, builder: any): Promise<T | null> => {
    try {
      const res = await builder;
      if (res.error) {
        console.error(`fetchAllData: error en ${label}:`, res.error);
        anyError = true;
        return null;
      }
      return res.data;
    } catch (e) {
      console.error(`fetchAllData: exception en ${label}:`, e);
      anyError = true;
      return null;
    }
  };

  const [projects, tasks, settings, invoices] = await Promise.all([
    safeQuery<any[]>('projects', supabase.from('projects').select('*').order('created_at', { ascending: true }).limit(500)),
    safeQuery<any[]>('tasks', supabase.from('tasks').select('*').order('created_at', { ascending: true }).limit(2000)),
    safeQuery<any>('settings', supabase.from('settings').select('*').maybeSingle()),
    safeQuery<any[]>('invoices', supabase.from('invoices').select('*').order('month', { ascending: false }).limit(500)),
  ]);

  return {
    projects: (projects ?? []).map(rowToProject),
    tasks: (tasks ?? []).map(rowToTask),
    settings: settings ? rowToSettings(settings) : null,
    invoices: (invoices ?? []).map(rowToInvoice),
    connectionOk: !anyError,
  };
}

// ---- Projects ----
export async function upsertProject(p: Project): Promise<void> {
  if (!isSupabaseConfigured) return;
  validateString(p.id, 'project.id');
  const row = projectToRow(p, await uid());
  await withRetry(async () => {
    let res = await supabase.from('projects').upsert(row);
    if (res.error && /objectives/i.test(res.error.message)) {
      const rowNoObj: Record<string, unknown> = { ...row };
      delete rowNoObj.objectives;
      res = await supabase.from('projects').upsert(rowNoObj);
    }
    if (res.error) throw res.error;
  });
}

export async function deleteProjectCascade(projectId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  validateString(projectId, 'projectId');
  const { data: files } = await supabase
    .from('project_files').select('storage_path').eq('project_id', projectId);
  const paths = (files ?? []).map((f) => f.storage_path);
  if (paths.length) await supabase.storage.from('project-files').remove(paths);
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

// ---- Tasks ----
export async function upsertTask(t: Task): Promise<void> {
  if (!isSupabaseConfigured) return;
  validateString(t.id, 'task.id');
  await withRetry(async () => {
    const { error } = await supabase.from('tasks').upsert(taskToRow(t, await uid()));
    if (error) throw error;
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  validateString(taskId, 'taskId');
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

// ---- Invoices ----
export async function upsertInvoice(inv: Invoice): Promise<void> {
  if (!isSupabaseConfigured) return;
  validateString(inv.id, 'invoice.id');
  await withRetry(async () => {
    const { error } = await supabase.from('invoices').upsert(invoiceToRow(inv, await uid()));
    if (error) throw error;
  });
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  validateString(invoiceId, 'invoiceId');
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
  if (error) throw error;
}

// ---- Settings ----
export async function upsertSettings(s: Settings): Promise<void> {
  if (!isSupabaseConfigured) return;
  await withRetry(async () => {
    const { error } = await supabase.from('settings').upsert(settingsToRow(s, await uid()));
    if (error) throw error;
  });
}

// ---- Profiles ----
export async function fetchProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return (data ?? []).map(rowToProfile);
}

export async function updateProfileName(profileId: string, displayName: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', profileId);
  if (error) throw error;
}

// ---- Files ----
export async function listProjectFiles(projectId: string): Promise<ProjectFile[]> {
  if (!isSupabaseConfigured) return [];
  validateString(projectId, 'projectId');
  const { data, error } = await supabase
    .from('project_files').select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProjectFile);
}

export async function uploadProjectFile(projectId: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  if (!isSupabaseConfigured) throw new AppError('La nube no está configurada. Activa Supabase para subir archivos.', 'VALIDATION', false);
  if (!file || file.size <= 0) throw new AppError('Archivo inválido', 'VALIDATION', false);
  if (file.size > 50 * 1024 * 1024) throw new AppError('El archivo excede 50MB', 'VALIDATION', false);
  const userId = await uid();
  const safeName = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${userId}/${projectId}/${crypto.randomUUID()}-${safeName}`;
  const up = await supabase.storage.from('project-files').upload(path, file, {
    onUploadProgress: (progress: { loaded: number; total: number }) => {
      if (onProgress && progress.total > 0) {
        onProgress(Math.round((progress.loaded / progress.total) * 100));
      }
    },
  } as any);
  if (up.error) throw up.error;
  const { error } = await supabase.from('project_files').insert({
    user_id: userId,
    project_id: projectId,
    file_name: file.name,
    storage_path: path,
    size_bytes: file.size,
    mime_type: file.type,
  });
  if (error) throw error;
}

export async function deleteProjectFile(f: ProjectFile): Promise<void> {
  if (!isSupabaseConfigured) return;
  validateString(f.id, 'file.id');
  await supabase.storage.from('project-files').remove([f.storagePath]);
  const { error } = await supabase.from('project_files').delete().eq('id', f.id);
  if (error) throw error;
}

export async function updateProjectSharing(projectId: string, sharedWith: string[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('projects').update({ shared_with: sharedWith }).eq('id', projectId);
  if (error) throw error;
}

export async function getFileDownloadUrl(f: ProjectFile): Promise<string> {
  if (!isSupabaseConfigured) throw new AppError('La nube no está configurada.', 'VALIDATION', false);
  validateString(f.storagePath, 'file.storagePath');
  const { data, error } = await supabase.storage
    .from('project-files').createSignedUrl(f.storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

const CHUNK_SIZE = 50;

export async function bulkInsert(data: {
  projects: Project[]; tasks: Task[]; settings: Settings | null;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const userId = await uid();

  const insertChunked = async <T>(
    table: string,
    rows: T[],
    toRow: (item: T, uid: string) => Record<string, unknown>,
  ) => {
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from(table).insert(chunk.map((r) => toRow(r, userId)));
      if (error) throw error;
    }
  };

  if (data.projects.length) await insertChunked('projects', data.projects, projectToRow as any);
  if (data.tasks.length) await insertChunked('tasks', data.tasks, taskToRow as any);
  if (data.settings) {
    const { error } = await supabase.from('settings').upsert(settingsToRow(data.settings, userId));
    if (error) throw error;
  }
}

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