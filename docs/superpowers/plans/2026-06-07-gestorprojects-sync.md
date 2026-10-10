# Plan de implementación — gestorprojects v1: Sync multi-dispositivo

**Spec:** `docs/superpowers/specs/2026-06-07-gestorprojects-sync-design.md`
**Fecha:** 2026-06-07

## Goal

Migrar `gestorprojects` de `localStorage` a Supabase con login de 1 cuenta, sync en
tiempo real entre teléfono y PC, proyectos enriquecidos (cliente/estado/fechas/notas/
links/archivos), PWA instalable y deploy en Vercel conectado a GitHub. **Pagos diferidos**
(no se construyen; el modelo queda listo).

## Architecture overview

- Frontend Vite/React intacto en estructura; los datos pasan de `localStorage` a una
  **capa de servicios Supabase** (`src/services/db.ts`) + **mappers puros**
  (`src/lib/mappers.ts`).
- `App.tsx` mantiene el estado en memoria (mismas formas de `types.ts`), pero:
  carga inicial desde caché → red; los handlers escriben vía `db.ts` (optimista);
  **realtime + refetch-on-focus** resincronizan.
- Auth con Supabase (`useAuth` + `Login`), gate en `App`.
- Postgres con **RLS** (`auth.uid() = user_id`) + bucket Storage privado.
- PWA con `vite-plugin-pwa`. Deploy Vercel Hobby + GitHub.

## Tech stack

React 19, Vite 8, TypeScript 6, `@supabase/supabase-js` v2, `vite-plugin-pwa`,
`@vite-pwa/assets-generator`, `vitest` (tests de lógica pura), Supabase
(Postgres/Auth/Realtime/Storage), Vercel.

## File map

**Crear:**
- `supabase/schema.sql` — DDL, RLS, bucket, realtime publication
- `.env.example`, `.env.local`
- `src/vite-env.d.ts` — tipos de env (sobrescribe el default de Vite incluyendo `vite/client`)
- `src/lib/supabase.ts` — cliente
- `src/lib/mappers.ts` + `src/lib/mappers.test.ts`
- `src/lib/migrateLocal.ts` + `src/lib/migrateLocal.test.ts`
- `src/services/db.ts` — CRUD
- `src/hooks/useAuth.ts`
- `src/components/Login.tsx`
- `src/components/ProjectInfoPanel.tsx` — cliente/estado/fechas/notas/links
- `src/components/ProjectFiles.tsx` — adjuntos
- `vitest.config.ts`
- `vercel.json` — SPA rewrites
- `pwa-assets.config.ts` + `public/pwa-icon.svg`

**Modificar:**
- `package.json` (deps + scripts)
- `src/types.ts` (Project + ProjectLink + ProjectFile + ProjectStatus)
- `src/App.tsx` (auth gate, carga cloud, realtime, handlers async, caché)
- `src/components/Modals.tsx` (ProjectModal: cliente/estado/fechas)
- `src/components/ProjectDetails.tsx` (montar ProjectInfoPanel + ProjectFiles + onUpdateProject)
- `src/components/Dashboard.tsx` (badge de estado + orden)
- `src/components/Settings.tsx` (cerrar sesión + copy de sync)
- `vite.config.ts` (plugin PWA)
- `.gitignore` (`.env.local`)

---

## Nota de testing

- **Gate por tarea = `npm run build`** (ejecuta `tsc -b && vite build`): valida tipos +
  compilación, el riesgo principal de la migración TS.
- **Vitest** cubre la lógica pura crítica: mappers DB↔dominio y migración localStorage.
- Auth/realtime/storage/UI: **verificación manual** con `npm run dev` (requieren Supabase
  vivo). Cada tarea de esas indica el resultado esperado en pantalla.

---

# Phase 0 — Supabase: proyecto + esquema

## Task 0.1 — Crear proyecto Supabase y cuenta (manual)

**Pasos (Angelo, en el navegador):**
1. Entrar a https://supabase.com → New project. Nombre `gestorprojects`, región la más
   cercana (East US), generar y **guardar la DB password**.
2. Al terminar, Project Settings → API: copiar **Project URL** y **anon public key**.
3. Authentication → Providers → Email: dejar habilitado. Authentication → Sign In / Up →
   **desactivar "Allow new users to sign up"** (lo activamos solo para crear tu cuenta en
   el paso siguiente).
4. Authentication → Users → Add user → email + password (tu cuenta). Luego confirmar que
   "Allow new users to sign up" quede **OFF**.

**Verificación:** existe 1 usuario en Authentication → Users; tienes URL + anon key
anotados. (Sin commit — paso externo.)

## Task 0.2 — Esquema SQL (tablas + RLS + storage + realtime)

**Archivo:** `supabase/schema.sql`

**Paso 1.** Crear `supabase/schema.sql` con:

```sql
-- gestorprojects schema (v1). Ejecutar en Supabase → SQL Editor.

-- ---------- TABLES ----------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  description text not null default '',
  color       text not null default '#FF6B00',
  client      text not null default '',
  status      text not null default 'active' check (status in ('active','paused','done')),
  start_date  date,
  due_date    date,
  notes       text not null default '',
  links       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  project_id  uuid not null references public.projects on delete cascade,
  title       text not null,
  description text not null default '',
  status      text not null check (status in ('todo','in_progress','review','done')),
  priority    text not null check (priority in ('low','medium','high')),
  due_date    date,
  tags        jsonb not null default '[]'::jsonb,
  subtasks    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.pomodoro_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  project_id   uuid references public.projects on delete set null,
  project_name text not null,
  minutes      integer not null,
  date         date not null
);

create table if not exists public.settings (
  user_id             uuid primary key references auth.users on delete cascade,
  focus_time          integer not null default 25,
  break_time          integer not null default 5,
  long_break_time     integer not null default 15,
  daily_goal_minutes  integer not null default 120,
  google_calendar_url text not null default ''
);

create table if not exists public.project_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  project_id   uuid not null references public.projects on delete cascade,
  file_name    text not null,
  storage_path text not null,
  size_bytes   bigint not null default 0,
  mime_type    text not null default '',
  uploaded_at  timestamptz not null default now()
);

create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists files_project_idx on public.project_files(project_id);

-- ---------- RLS ----------
alter table public.projects          enable row level security;
alter table public.tasks             enable row level security;
alter table public.pomodoro_sessions enable row level security;
alter table public.settings          enable row level security;
alter table public.project_files     enable row level security;

create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.pomodoro_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own files" on public.project_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "own files read" on storage.objects for select
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- REALTIME ----------
alter publication supabase_realtime add table
  public.projects, public.tasks, public.pomodoro_sessions, public.settings;
```

**Paso 2.** En Supabase → SQL Editor, pegar y ejecutar el contenido. Debe terminar
`Success. No rows returned`.

**Verificación:** Table Editor muestra `projects`, `tasks`, `pomodoro_sessions`,
`settings`, `project_files`. Storage muestra bucket `project-files`.

**Commit:**
```bash
git add supabase/schema.sql
git commit -m "feat(db): add Supabase schema, RLS policies and storage bucket"
```

---

# Phase 1 — Plumbing: deps, env, cliente, tipos, mappers

## Task 1.1 — Dependencias, scripts y env

**Paso 1.** Instalar:
```bash
npm install @supabase/supabase-js
npm install -D vite-plugin-pwa @vite-pwa/assets-generator vitest
```

**Paso 2.** En `package.json`, sección `scripts`, añadir `test` e `icons`:
```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "icons": "pwa-assets-generator"
  },
```

**Paso 3.** Crear `.env.example`:
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

**Paso 4.** Crear `.env.local` con los valores reales del Task 0.1:
```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # anon public key real
```

**Paso 5.** En `.gitignore`, confirmar/añadir línea (Vite ya ignora `*.local`, pero ser
explícito):
```
.env.local
.env*.local
```

**Verificación:**
```bash
npm run build
```
Debe compilar sin errores (las nuevas deps no rompen nada todavía).

**Commit:**
```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "chore: add supabase, pwa and vitest deps + env scaffolding"
```
> `.env.local` NO se commitea.

## Task 1.2 — Tipos de entorno + cliente Supabase

**Paso 1.** Crear `src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Paso 2.** Crear `src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa tu .env.local',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'gp_auth',
  },
});
```

**Verificación:**
```bash
npm run build
```
Compila sin errores.

**Commit:**
```bash
git add src/vite-env.d.ts src/lib/supabase.ts
git commit -m "feat: add Supabase client and env typings"
```

## Task 1.3 — Extender tipos de dominio

**Archivo:** `src/types.ts`

**Paso 1.** Añadir tipos nuevos y extender `Project` (reemplazar la interfaz `Project`
actual, líneas 23–29, y añadir lo demás):
```ts
export type ProjectStatus = 'active' | 'paused' | 'done';

export interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  storagePath: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string; // Hex color code
  client: string; // cliente/contacto ('' si no aplica)
  status: ProjectStatus;
  startDate: string; // '' o YYYY-MM-DD
  dueDate: string; // '' o YYYY-MM-DD
  notes: string; // brief/docs
  links: ProjectLink[];
  createdAt: string;
}
```
> Campos nuevos son **no-opcionales con default vacío** para no llenar los componentes de
> `?.`. Los defaults los aplican mappers (DB) y migración (local).

**Verificación:**
```bash
npm run build
```
Esperado: **falla** con errores en `App.tsx` (DEFAULT_PROJECTS) y `Modals.tsx` por campos
faltantes. Eso confirma que el tipo se aplicó. Se corrige en Task 1.4 + Fase 6.

> No commitear aún (build roto). Continuar a 1.4 que repara el default.

## Task 1.4 — Reparar datos sembrados + mappers (con tests)

**Paso 1.** En `src/App.tsx`, actualizar `DEFAULT_PROJECTS` (líneas 15–23) para incluir los
campos nuevos:
```ts
const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'floxai-launch',
    name: 'FloxAI - Lanzamiento',
    description: 'Estrategia, contenido orgánico y diseño del funnel de conversión de FloxAI.',
    color: '#FF6B00',
    client: 'FloxAI',
    status: 'active',
    startDate: '',
    dueDate: '',
    notes: '',
    links: [],
    createdAt: new Date().toISOString(),
  },
];
```

**Paso 2.** Crear `src/lib/mappers.ts` (filas snake_case ↔ dominio camelCase):
```ts
import type {
  Project, Task, PomodoroSession, Settings, ProjectLink, ProjectFile,
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

// ---- PomodoroSession ----
export function rowToSession(r: any): PomodoroSession {
  return {
    id: r.id,
    projectId: r.project_id ?? '',
    projectName: r.project_name,
    minutes: r.minutes,
    date: r.date,
  };
}

export function sessionToRow(s: PomodoroSession, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    project_id: s.projectId === '' ? null : s.projectId,
    project_name: s.projectName,
    minutes: s.minutes,
    date: s.date,
  };
}

// ---- Settings ----
export function rowToSettings(r: any): Settings {
  return {
    focusTime: r.focus_time,
    breakTime: r.break_time,
    longBreakTime: r.long_break_time,
    dailyGoalMinutes: r.daily_goal_minutes,
    googleCalendarUrl: r.google_calendar_url ?? '',
  };
}

export function settingsToRow(s: Settings, userId: string) {
  return {
    user_id: userId,
    focus_time: s.focusTime,
    break_time: s.breakTime,
    long_break_time: s.longBreakTime,
    daily_goal_minutes: s.dailyGoalMinutes,
    google_calendar_url: s.googleCalendarUrl,
  };
}

// ---- ProjectFile ----
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
```

**Paso 3.** Crear `src/lib/mappers.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { projectToRow, rowToProject, taskToRow, rowToTask } from './mappers';
import type { Project, Task } from '../types';

const project: Project = {
  id: 'p1', name: 'P', description: 'd', color: '#FF6B00',
  client: 'FloxAI', status: 'active', startDate: '', dueDate: '2026-01-02',
  notes: 'n', links: [{ id: 'l1', label: 'Drive', url: 'https://x' }],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('project mappers', () => {
  it('converts empty dates to null for the DB', () => {
    const row = projectToRow(project, 'u1');
    expect(row.start_date).toBeNull();
    expect(row.due_date).toBe('2026-01-02');
    expect(row.user_id).toBe('u1');
  });

  it('round-trips through the DB shape', () => {
    const back = rowToProject(projectToRow(project, 'u1'));
    expect(back).toEqual(project);
  });

  it('defaults missing optional fields when reading a row', () => {
    const p = rowToProject({ id: 'p2', name: 'X', color: '#000', status: 'paused', created_at: 't' });
    expect(p.client).toBe('');
    expect(p.links).toEqual([]);
    expect(p.startDate).toBe('');
  });
});

const task: Task = {
  id: 't1', projectId: 'p1', title: 'T', description: '', status: 'todo',
  priority: 'high', dueDate: '', tags: ['a'], subtasks: [], createdAt: '2026-01-01T00:00:00.000Z',
};

describe('task mappers', () => {
  it('round-trips and nulls empty dueDate', () => {
    const row = taskToRow(task, 'u1');
    expect(row.due_date).toBeNull();
    expect(rowToTask(row)).toEqual(task);
  });
});
```

**Paso 4.** Crear `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

**Verificación:**
```bash
npm run test
npm run build
```
Esperado: tests **pasan** (5 tests verdes), build **compila** (default reparado).

**Commit:**
```bash
git add src/types.ts src/App.tsx src/lib/mappers.ts src/lib/mappers.test.ts vitest.config.ts
git commit -m "feat(types): enrich Project model and add DB<->domain mappers with tests"
```

---

# Phase 2 — Capa de servicios (db.ts)

## Task 2.1 — CRUD de datos + carga inicial

**Archivo:** `src/services/db.ts`

**Paso 1.** Crear `src/services/db.ts`:
```ts
import { supabase } from '../lib/supabase';
import type { Project, Task, PomodoroSession, Settings, ProjectFile } from '../types';
import {
  rowToProject, projectToRow, rowToTask, taskToRow,
  rowToSession, sessionToRow, rowToSettings, settingsToRow, rowToProjectFile,
} from '../lib/mappers';

async function uid(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('No hay sesión activa');
  return data.user.id;
}

export interface AllData {
  projects: Project[];
  tasks: Task[];
  sessions: PomodoroSession[];
  settings: Settings | null;
}

export async function fetchAllData(): Promise<AllData> {
  const [projects, tasks, sessions, settings] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: true }),
    supabase.from('tasks').select('*').order('created_at', { ascending: true }),
    supabase.from('pomodoro_sessions').select('*').order('date', { ascending: true }),
    supabase.from('settings').select('*').maybeSingle(),
  ]);
  for (const r of [projects, tasks, sessions, settings]) {
    if (r.error) throw r.error;
  }
  return {
    projects: (projects.data ?? []).map(rowToProject),
    tasks: (tasks.data ?? []).map(rowToTask),
    sessions: (sessions.data ?? []).map(rowToSession),
    settings: settings.data ? rowToSettings(settings.data) : null,
  };
}

// ---- Projects ----
export async function upsertProject(p: Project): Promise<void> {
  const { error } = await supabase.from('projects').upsert(projectToRow(p, await uid()));
  if (error) throw error;
}

export async function deleteProjectCascade(projectId: string): Promise<void> {
  // 1) borrar archivos en Storage
  const { data: files } = await supabase
    .from('project_files').select('storage_path').eq('project_id', projectId);
  const paths = (files ?? []).map((f) => f.storage_path);
  if (paths.length) await supabase.storage.from('project-files').remove(paths);
  // 2) borrar proyecto (tasks + project_files caen por FK ON DELETE CASCADE)
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

// ---- Tasks ----
export async function upsertTask(t: Task): Promise<void> {
  const { error } = await supabase.from('tasks').upsert(taskToRow(t, await uid()));
  if (error) throw error;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

// ---- Sessions ----
export async function upsertSession(s: PomodoroSession): Promise<void> {
  const { error } = await supabase.from('pomodoro_sessions').upsert(sessionToRow(s, await uid()));
  if (error) throw error;
}

// ---- Settings ----
export async function upsertSettings(s: Settings): Promise<void> {
  const { error } = await supabase.from('settings').upsert(settingsToRow(s, await uid()));
  if (error) throw error;
}

// ---- Files ----
export async function listProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from('project_files').select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProjectFile);
}

export async function uploadProjectFile(projectId: string, file: File): Promise<void> {
  const userId = await uid();
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${userId}/${projectId}/${crypto.randomUUID()}-${safeName}`;
  const up = await supabase.storage.from('project-files').upload(path, file);
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
  await supabase.storage.from('project-files').remove([f.storagePath]);
  const { error } = await supabase.from('project_files').delete().eq('id', f.id);
  if (error) throw error;
}

export async function getFileDownloadUrl(f: ProjectFile): Promise<string> {
  const { data, error } = await supabase.storage
    .from('project-files').createSignedUrl(f.storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}
```

**Verificación:**
```bash
npm run build
```
Compila sin errores.

**Commit:**
```bash
git add src/services/db.ts
git commit -m "feat(db): add Supabase CRUD service layer for all entities and files"
```

---

# Phase 3 — Auth

## Task 3.1 — Hook useAuth

**Archivo:** `src/hooks/useAuth.ts`

**Paso 1.** Crear `src/hooks/useAuth.ts`:
```ts
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signOut = () => supabase.auth.signOut();

  const resetPassword = (email: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });

  return { user, loading, signIn, signOut, resetPassword };
}
```

**Verificación:**
```bash
npm run build
```
Compila sin errores.

**Commit:**
```bash
git add src/hooks/useAuth.ts
git commit -m "feat(auth): add useAuth hook"
```

## Task 3.2 — Pantalla de Login

**Archivo:** `src/components/Login.tsx`

**Paso 1.** Crear `src/components/Login.tsx`:
```tsx
import React, { useState } from 'react';

interface LoginProps {
  onSignIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  onReset: (email: string) => Promise<{ error: { message: string } | null }>;
}

export const Login: React.FC<LoginProps> = ({ onSignIn, onReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    const { error } = await onSignIn(email.trim(), password);
    setBusy(false);
    if (error) setError('Correo o contraseña incorrectos.');
  };

  const handleReset = async () => {
    if (!email.trim()) { setError('Escribe tu correo para recuperar la contraseña.'); return; }
    setError(''); setInfo('');
    const { error } = await onReset(email.trim());
    if (error) setError(error.message);
    else setInfo('Te enviamos un correo para restablecer la contraseña.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="modal-content" style={{ maxWidth: '380px', width: '100%' }}>
        <div className="modal-header">
          <h3 className="modal-title">⚡ gestorprojects</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input type="email" className="form-control" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: 'var(--priority-high-text)', fontSize: '0.85rem' }}>{error}</p>}
            {info && <p style={{ color: '#227A37', fontSize: '0.85rem' }}>{info}</p>}
          </div>
          <div className="modal-footer" style={{ flexDirection: 'column', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Entrando…' : 'Iniciar sesión'}
            </button>
            <button type="button" onClick={handleReset}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**Verificación:**
```bash
npm run build
```
Compila sin errores.

**Commit:**
```bash
git add src/components/Login.tsx
git commit -m "feat(auth): add Login screen"
```

## Task 3.3 — Gate de auth en App

**Archivo:** `src/App.tsx`

**Paso 1.** Añadir imports al inicio (junto a los otros):
```ts
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
```

**Paso 2.** Dentro de `export default function App()`, como primeras líneas del cuerpo
(antes del estado de theme), añadir:
```ts
  const { user, loading: authLoading, signIn, signOut, resetPassword } = useAuth();
```

**Paso 3.** Justo antes del `return (` principal, añadir el gate:
```ts
  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Cargando…</div>;
  }
  if (!user) {
    return <Login onSignIn={signIn} onReset={resetPassword} />;
  }
```
> `signOut` se conecta a Settings en la Fase 6. Por ahora, prefijar con `void signOut;`
> NO es necesario: se usará luego; si el linter marca no-usado, dejar el wiring de Settings
> (Task 6.5) en el mismo lote. Para mantener verde el build de esta tarea, pasar `signOut`
> a Settings ya aquí (ver Paso 4).

**Paso 4.** En el render de Settings (`currentTab === 'settings'`), añadir la prop
`onSignOut={signOut}` (la consume Task 6.5; el tipo se agrega en esa tarea, así que para
ESTA tarea mantener el build verde añadiendo el prop **junto** con su tipo en Settings —
ejecutar Task 6.5 inmediatamente después, o temporalmente referenciar `void signOut;` al
final del componente). **Decisión:** referenciar `void signOut;` justo antes del gate para
no romper el build aislado:
```ts
  void signOut; // se conecta a Settings en Task 6.5
```

**Verificación:**
```bash
npm run dev
```
Abrir la URL local. Esperado: aparece la **pantalla de Login** (no el dashboard). Iniciar
sesión con tu cuenta del Task 0.1 → entra a la app (que aún lee de localStorage; la carga
cloud llega en Fase 4). Cerrar dev server.

**Commit:**
```bash
git add src/App.tsx
git commit -m "feat(auth): gate app behind login"
```

---

# Phase 4 — Conectar App a la nube

## Task 4.1 — Carga inicial cloud + caché + escritura optimista

**Archivo:** `src/App.tsx`

**Paso 1.** Añadir import:
```ts
import * as db from './services/db';
```

**Paso 2.** Reemplazar la inicialización de los estados core (líneas ~122–125) para
hidratar desde caché local (paint instantáneo):
```ts
  const [projects, setProjects] = useState<Project[]>(() => readCache('gp_projects', []));
  const [tasks, setTasks] = useState<Task[]>(() => readCache('gp_tasks', []));
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>(() => readCache('gp_sessions', []));
  const [settings, setSettings] = useState<SettingsType>(() => readCache('gp_settings', DEFAULT_SETTINGS));
```

**Paso 3.** Añadir helper `readCache` arriba del componente (después de `DEFAULT_SETTINGS`):
```ts
function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
```

**Paso 4.** Reemplazar **todo** el `useEffect` de "Load Initial Data from localStorage"
(líneas ~134–172) por carga desde Supabase + función reutilizable `refetchAll`:
```ts
  const refetchAll = async () => {
    try {
      const data = await db.fetchAllData();
      setProjects(data.projects);
      setTasks(data.tasks);
      setPomodoroSessions(data.sessions);
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error('Error cargando datos', e);
    }
  };

  useEffect(() => {
    if (!user) return; // gate aún no retorna aquí; user puede ser null en 1er render
    refetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
```
> Los `useEffect` se declaran **antes** del gate `if (!user) return <Login/>` (Rules of
> Hooks). Por eso guardan `if (!user) return;` y usan `user?.id` en deps.

**Paso 5.** Añadir un `useEffect` que escribe la caché local cuando cambian los datos
(reemplaza el rol de los antiguos `saveX`):
```ts
  useEffect(() => { localStorage.setItem('gp_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('gp_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('gp_sessions', JSON.stringify(pomodoroSessions)); }, [pomodoroSessions]);
  useEffect(() => { localStorage.setItem('gp_settings', JSON.stringify(settings)); }, [settings]);
```

**Paso 6.** Eliminar las funciones `saveProjects`, `saveTasks`, `saveSessions` (líneas
~175–188) y reemplazar los handlers para que actualicen estado **y** escriban en Supabase.
Reemplazos:

`handleSaveProject`:
```ts
  const handleSaveProject = async (projectData: { name: string; description: string; color: string }) => {
    if (editingProject) {
      const updated: Project = { ...editingProject, ...projectData };
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProject(null);
      try { await db.upsertProject(updated); } catch (e) { console.error(e); refetchAll(); }
    } else {
      const newProj: Project = {
        id: crypto.randomUUID(),
        ...projectData,
        client: '', status: 'active', startDate: '', dueDate: '', notes: '', links: [],
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProj]);
      setActiveProjectId(newProj.id);
      setTab('project');
      try { await db.upsertProject(newProj); } catch (e) { console.error(e); refetchAll(); }
    }
  };
```

`handleUpdateProject` (NUEVO — usado por ProjectInfoPanel en Fase 6):
```ts
  const handleUpdateProject = async (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try { await db.upsertProject(updated); } catch (e) { console.error(e); refetchAll(); }
  };
```

`handleDeleteProject`:
```ts
  const handleDeleteProject = async () => {
    if (!activeProjectId) return;
    const id = activeProjectId;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    setActiveProjectId(null);
    setTab('dashboard');
    try { await db.deleteProjectCascade(id); } catch (e) { console.error(e); refetchAll(); }
  };
```

`handleSaveTask` (mantiene confetti, cambia persistencia):
```ts
  const handleSaveTask = async (taskData: {
    title: string; description: string; status: TaskStatus; priority: TaskPriority;
    dueDate: string; tags: string[]; subtasks: SubTask[];
  }) => {
    if (!activeProjectId) return;
    if (editingTask) {
      const isNowDone = taskData.status === 'done' && editingTask.status !== 'done';
      const updated: Task = { ...editingTask, ...taskData };
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setEditingTask(null);
      if (isNowDone) triggerSuccessConfetti();
      try { await db.upsertTask(updated); } catch (e) { console.error(e); refetchAll(); }
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(), projectId: activeProjectId, ...taskData,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
      if (newTask.status === 'done') triggerSuccessConfetti();
      try { await db.upsertTask(newTask); } catch (e) { console.error(e); refetchAll(); }
    }
  };
```

`handleDeleteTask`:
```ts
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setEditingTask(null);
    try { await db.deleteTask(taskId); } catch (e) { console.error(e); refetchAll(); }
  };
```

`handleUpdateTaskStatus`:
```ts
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;
    const wasDone = taskToMove.status === 'done';
    const updated: Task = { ...taskToMove, status: newStatus };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (newStatus === 'done' && !wasDone) triggerSuccessConfetti();
    try { await db.upsertTask(updated); } catch (e) { console.error(e); refetchAll(); }
  };
```

`handleAddPomodoroSession`:
```ts
  const handleAddPomodoroSession = async (projectId: string, projectName: string, minutes: number) => {
    const newSession: PomodoroSession = {
      id: crypto.randomUUID(), projectId, projectName, minutes,
      date: new Date().toISOString().split('T')[0],
    };
    setPomodoroSessions((prev) => [...prev, newSession]);
    try { await db.upsertSession(newSession); } catch (e) { console.error(e); refetchAll(); }
  };
```

`handleUpdateSettings`:
```ts
  const handleUpdateSettings = async (newSettings: SettingsType) => {
    setSettings(newSettings);
    try { await db.upsertSettings(newSettings); } catch (e) { console.error(e); refetchAll(); }
  };
```

**Paso 7.** `handleExportData` queda igual. `handleImportData` se reemplaza en Fase 5
(Task 5.2). Para esta tarea, dejar `handleImportData` como está (sigue válido escribiendo
estado; la versión cloud llega en 5.2).

**Verificación:**
```bash
npm run build
```
Compila. Luego `npm run dev`: login → crear un proyecto → recargar la página → el proyecto
**persiste** (vino de Supabase, no del seed). En Supabase → Table Editor → `projects` debe
verse la fila nueva con tu `user_id`.

**Commit:**
```bash
git add src/App.tsx
git commit -m "feat(sync): load from Supabase, optimistic writes, local cache"
```

## Task 4.2 — Realtime + refetch al enfocar ventana

**Archivo:** `src/App.tsx`

**Paso 1.** Importar el cliente para el canal realtime:
```ts
import { supabase } from './lib/supabase';
```

**Paso 2.** Añadir un `useEffect` (después del de carga) con realtime + focus/visibility:
```ts
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { refetchAll(); }, 300);
    };

    const channel = supabase
      .channel('gp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pomodoro_sessions' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, debouncedRefetch)
      .subscribe();

    const onFocus = () => { if (document.visibilityState === 'visible') refetchAll(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
```

**Verificación:**
```bash
npm run build
```
Compila. Verificación manual de sync: abrir la app en dos pestañas/dispositivos logueados;
crear un proyecto en una; en la otra aparece solo (realtime) o al enfocar la ventana.

**Commit:**
```bash
git add src/App.tsx
git commit -m "feat(sync): realtime subscriptions and refetch on focus"
```

---

# Phase 5 — Migración de datos locales existentes

## Task 5.1 — Función de migración (con tests)

**Archivo:** `src/lib/migrateLocal.ts`

**Paso 1.** Crear `src/lib/migrateLocal.ts`:
```ts
import type { Project, Task, PomodoroSession, Settings } from '../types';

export interface LocalSnapshot {
  projects: Project[];
  tasks: Task[];
  sessions: PomodoroSession[];
  settings: Settings | null;
}

const DEFAULT_SETTINGS: Settings = {
  focusTime: 25, breakTime: 5, longBreakTime: 15, dailyGoalMinutes: 120, googleCalendarUrl: '',
};

/** Normaliza datos viejos de localStorage al modelo enriquecido actual. */
export function normalizeLocalData(raw: {
  projects?: any[]; tasks?: any[]; sessions?: any[]; settings?: any;
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

  const sessions: PomodoroSession[] = (raw.sessions ?? []).map((s) => ({
    id: s.id,
    projectId: s.projectId ?? '',
    projectName: s.projectName ?? '',
    minutes: s.minutes ?? 0,
    date: s.date ?? new Date().toISOString().split('T')[0],
  }));

  const settings: Settings | null = raw.settings
    ? { ...DEFAULT_SETTINGS, ...raw.settings }
    : null;

  return { projects, tasks, sessions, settings };
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
    sessions: parse('gp_sessions'),
    settings: parse('gp_settings'),
  });
}
```

**Paso 2.** Crear `src/lib/migrateLocal.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { normalizeLocalData } from './migrateLocal';

describe('normalizeLocalData', () => {
  it('fills new Project fields from old localStorage shape', () => {
    const out = normalizeLocalData({
      projects: [{ id: 'p1', name: 'Viejo', description: 'd', color: '#000', createdAt: 't' }],
    });
    expect(out.projects[0]).toMatchObject({
      id: 'p1', client: '', status: 'active', startDate: '', dueDate: '', notes: '', links: [],
    });
  });

  it('keeps tasks and defaults missing arrays', () => {
    const out = normalizeLocalData({ tasks: [{ id: 't1', projectId: 'p1', title: 'X', status: 'todo', priority: 'high' }] });
    expect(out.tasks[0].tags).toEqual([]);
    expect(out.tasks[0].subtasks).toEqual([]);
  });

  it('returns null settings when absent', () => {
    expect(normalizeLocalData({}).settings).toBeNull();
  });
});
```

**Verificación:**
```bash
npm run test
```
Esperado: tests nuevos pasan (total 8 verdes).

**Commit:**
```bash
git add src/lib/migrateLocal.ts src/lib/migrateLocal.test.ts
git commit -m "feat(migration): normalize and read local snapshot with tests"
```

## Task 5.2 — Prompt de importación en primer login (nube vacía)

**Archivo:** `src/App.tsx`, `src/services/db.ts`

**Paso 1.** En `src/services/db.ts`, añadir bulk insert para migración:
```ts
import type { Project, Task, PomodoroSession, Settings, ProjectFile } from '../types';
// ... (los imports de mappers ya incluyen los necesarios)

export async function bulkInsert(data: {
  projects: Project[]; tasks: Task[]; sessions: PomodoroSession[]; settings: Settings | null;
}): Promise<void> {
  const userId = await uid();
  if (data.projects.length) {
    const { error } = await supabase.from('projects').insert(data.projects.map((p) => projectToRow(p, userId)));
    if (error) throw error;
  }
  if (data.tasks.length) {
    const { error } = await supabase.from('tasks').insert(data.tasks.map((t) => taskToRow(t, userId)));
    if (error) throw error;
  }
  if (data.sessions.length) {
    const { error } = await supabase.from('pomodoro_sessions').insert(data.sessions.map((s) => sessionToRow(s, userId)));
    if (error) throw error;
  }
  if (data.settings) {
    const { error } = await supabase.from('settings').upsert(settingsToRow(data.settings, userId));
    if (error) throw error;
  }
}
```
> Asegurar que `projectToRow, taskToRow, sessionToRow, settingsToRow` estén importados en
> `db.ts` (ya lo están del Task 2.1).

**Paso 2.** En `src/App.tsx`, añadir import:
```ts
import { readLocalSnapshot } from './lib/migrateLocal';
```

**Paso 3.** Modificar `refetchAll` (Task 4.1) para detectar nube vacía y ofrecer la
importación una sola vez. Reemplazar el cuerpo por:
```ts
  const refetchAll = async () => {
    try {
      const data = await db.fetchAllData();
      const cloudEmpty = data.projects.length === 0 && data.tasks.length === 0;
      const local = readLocalSnapshot();
      const hasLocal = local.projects.length > 0 || local.tasks.length > 0;
      const alreadyAsked = localStorage.getItem('gp_migrated') === '1';

      if (cloudEmpty && hasLocal && !alreadyAsked) {
        const ok = confirm(
          `Detectamos ${local.projects.length} proyecto(s) y ${local.tasks.length} tarea(s) ` +
          `guardados en este dispositivo. ¿Importarlos a la nube?`,
        );
        localStorage.setItem('gp_migrated', '1');
        if (ok) {
          await db.bulkInsert(local);
          const fresh = await db.fetchAllData();
          setProjects(fresh.projects);
          setTasks(fresh.tasks);
          setPomodoroSessions(fresh.sessions);
          if (fresh.settings) setSettings(fresh.settings);
          return;
        }
      }

      setProjects(data.projects);
      setTasks(data.tasks);
      setPomodoroSessions(data.sessions);
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error('Error cargando datos', e);
    }
  };
```

**Paso 4.** Reemplazar `handleImportData` para que el import del Settings (JSON externo)
también escriba a la nube:
```ts
  const handleImportData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) return false;
      const snap = readLocalSnapshotFrom(parsed);
      setProjects(snap.projects);
      setTasks(snap.tasks);
      setPomodoroSessions(snap.sessions);
      if (snap.settings) setSettings(snap.settings);
      // persistir a la nube en background
      db.bulkInsert(snap).catch((e) => console.error('Error importando a la nube', e));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };
```

**Paso 5.** En `src/lib/migrateLocal.ts`, exportar un helper para normalizar un objeto ya
parseado (usado por el import de Settings):
```ts
export function readLocalSnapshotFrom(parsed: any): LocalSnapshot {
  return normalizeLocalData({
    projects: parsed.projects,
    tasks: parsed.tasks,
    sessions: parsed.pomodoroSessions ?? parsed.sessions,
    settings: parsed.settings,
  });
}
```
Y añadir su import en `App.tsx`:
```ts
import { readLocalSnapshot, readLocalSnapshotFrom } from './lib/migrateLocal';
```

**Verificación:**
```bash
npm run test
npm run build
```
Tests verdes, build compila. Manual: con datos en localStorage y nube vacía, primer login
muestra el `confirm` de importación; al aceptar, los proyectos aparecen y quedan en
Supabase (Table Editor).

**Commit:**
```bash
git add src/App.tsx src/services/db.ts src/lib/migrateLocal.ts
git commit -m "feat(migration): one-time local->cloud import on first login"
```

---

# Phase 6 — Proyectos enriquecidos (UI)

## Task 6.1 — ProjectModal: cliente, estado, fechas

**Archivo:** `src/components/Modals.tsx`

**Paso 1.** Importar tipos extra y extender la prop `onSave` de `ProjectModalProps`:
```ts
import type { Project, Task, SubTask, TaskStatus, TaskPriority, ProjectStatus } from '../types';
```
```ts
interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: {
    name: string; description: string; color: string;
    client: string; status: ProjectStatus; startDate: string; dueDate: string;
  }) => void;
  project?: Project | null;
}
```

**Paso 2.** Añadir estado y sincronización en `ProjectModal` (junto a name/description/color):
```ts
  const [client, setClient] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
```
En el `useEffect([project, isOpen])`, rama `if (project)` añadir:
```ts
      setClient(project.client);
      setStatus(project.status);
      setStartDate(project.startDate);
      setDueDate(project.dueDate);
```
Rama `else` añadir:
```ts
      setClient('');
      setStatus('active');
      setStartDate('');
      setDueDate('');
```

**Paso 3.** En `handleSubmit`, pasar los campos nuevos:
```ts
    onSave({ name, description, color, client, status, startDate, dueDate });
```

**Paso 4.** Añadir los campos al formulario, después del grupo de Descripción y antes del
de Color:
```tsx
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Crumpizza, FloxAI…"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-control" value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                  <option value="active">Activo</option>
                  <option value="paused">En pausa</option>
                  <option value="done">Terminado</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Inicio</label>
                <input type="date" className="form-control" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Entrega</label>
                <input type="date" className="form-control" value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
```

**Paso 5.** En `src/App.tsx`, actualizar la firma de `handleSaveProject` para aceptar los
campos nuevos (reemplaza la versión del Task 4.1):
```ts
  const handleSaveProject = async (projectData: {
    name: string; description: string; color: string;
    client: string; status: ProjectStatus; startDate: string; dueDate: string;
  }) => {
    if (editingProject) {
      const updated: Project = { ...editingProject, ...projectData };
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProject(null);
      try { await db.upsertProject(updated); } catch (e) { console.error(e); refetchAll(); }
    } else {
      const newProj: Project = {
        id: crypto.randomUUID(),
        ...projectData,
        notes: '', links: [],
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProj]);
      setActiveProjectId(newProj.id);
      setTab('project');
      try { await db.upsertProject(newProj); } catch (e) { console.error(e); refetchAll(); }
    }
  };
```
Y añadir el import de `ProjectStatus` en App:
```ts
import type { Project, Task, SubTask, PomodoroSession, Settings as SettingsType, TaskStatus, TaskPriority, ProjectStatus } from './types';
```

**Verificación:**
```bash
npm run build
```
Compila. Manual: crear/editar proyecto muestra cliente, estado y fechas; se guardan.

**Commit:**
```bash
git add src/components/Modals.tsx src/App.tsx
git commit -m "feat(projects): client, status and dates in project modal"
```

## Task 6.2 — ProjectInfoPanel: estado/fechas/notas/links

**Archivo:** `src/components/ProjectInfoPanel.tsx`

**Paso 1.** Crear `src/components/ProjectInfoPanel.tsx`:
```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import type { Project, ProjectStatus, ProjectLink } from '../types';

interface Props {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Activo', paused: 'En pausa', done: 'Terminado',
};

export const ProjectInfoPanel: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [notes, setNotes] = useState(project.notes);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setNotes(project.notes); }, [project.id]);

  // Autoguardado de notas (debounce 600ms)
  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      onUpdateProject({ ...project, notes: value });
    }, 600);
  };

  const setStatus = (status: ProjectStatus) => onUpdateProject({ ...project, status });
  const setStart = (startDate: string) => onUpdateProject({ ...project, startDate });
  const setDue = (dueDate: string) => onUpdateProject({ ...project, dueDate });

  const addLink = () => {
    if (!linkUrl.trim()) return;
    const link: ProjectLink = {
      id: crypto.randomUUID(),
      label: linkLabel.trim() || linkUrl.trim(),
      url: linkUrl.trim(),
    };
    onUpdateProject({ ...project, links: [...project.links, link] });
    setLinkLabel(''); setLinkUrl('');
  };

  const removeLink = (id: string) =>
    onUpdateProject({ ...project, links: project.links.filter((l) => l.id !== id) });

  return (
    <section className="settings-section" style={{ marginBottom: '1.5rem' }}>
      <div className="form-row">
        {project.client && (
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <div style={{ fontWeight: 600 }}>{project.client}</div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className="form-control" value={project.status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {(['active', 'paused', 'done'] as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Inicio</label>
          <input type="date" className="form-control" value={project.startDate}
            onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Entrega</label>
          <input type="date" className="form-control" value={project.dueDate}
            onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notas / Brief</label>
        <textarea className="form-control" rows={5}
          placeholder="Objetivos, contexto, decisiones del proyecto…"
          value={notes} onChange={(e) => handleNotesChange(e.target.value)} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Links / Recursos</label>
        {project.links.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
            {project.links.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, color: 'var(--primary)' }}>
                  <ExternalLink size={14} /> {l.label}
                </a>
                <button type="button" onClick={() => removeLink(l.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input type="text" className="form-control" style={{ flex: 1, minWidth: '120px' }}
            placeholder="Etiqueta (ej. Figma)" value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)} />
          <input type="url" className="form-control" style={{ flex: 2, minWidth: '160px' }}
            placeholder="https://…" value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
          <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={addLink}>
            <Plus size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
```

**Verificación:**
```bash
npm run build
```
Compila (el componente aún no se monta; se monta en 6.4).

**Commit:**
```bash
git add src/components/ProjectInfoPanel.tsx
git commit -m "feat(projects): ProjectInfoPanel with status, dates, notes and links"
```

## Task 6.3 — ProjectFiles: adjuntos (subir/listar/descargar/borrar)

**Archivo:** `src/components/ProjectFiles.tsx`

**Paso 1.** Crear `src/components/ProjectFiles.tsx`:
```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Download, Loader2 } from 'lucide-react';
import type { ProjectFile } from '../types';
import * as db from '../services/db';

interface Props { projectId: string; }

export const ProjectFiles: React.FC<Props> = ({ projectId }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try { setFiles(await db.listProjectFiles(projectId)); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { await db.uploadProjectFile(projectId, file); await load(); }
    catch (err) { console.error(err); alert('Error subiendo el archivo.'); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const handleDownload = async (f: ProjectFile) => {
    try { window.open(await db.getFileDownloadUrl(f), '_blank'); }
    catch (e) { console.error(e); alert('No se pudo generar el enlace.'); }
  };

  const handleDelete = async (f: ProjectFile) => {
    if (!confirm(`¿Eliminar "${f.fileName}"?`)) return;
    try { await db.deleteProjectFile(f); await load(); }
    catch (e) { console.error(e); alert('No se pudo eliminar.'); }
  };

  const fmtSize = (b: number) =>
    b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

  return (
    <section className="settings-section" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 className="settings-title" style={{ margin: 0 }}>📎 Archivos</h3>
        <label className="file-input-label">
          {busy ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
          <span>{busy ? 'Subiendo…' : 'Subir archivo'}</span>
          <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={busy} />
        </label>
      </div>

      {files.length === 0 ? (
        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Sin archivos adjuntos.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {files.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.fileName}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmtSize(f.sizeBytes)}</span>
              <button type="button" onClick={() => handleDownload(f)} title="Descargar"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                <Download size={15} />
              </button>
              <button type="button" onClick={() => handleDelete(f)} title="Eliminar"
                style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
```

**Paso 2.** Añadir la animación `spin` al final de `src/index.css`:
```css
@keyframes gp-spin { to { transform: rotate(360deg); } }
.spin { animation: gp-spin 0.8s linear infinite; }
```

**Verificación:**
```bash
npm run build
```
Compila.

**Commit:**
```bash
git add src/components/ProjectFiles.tsx src/index.css
git commit -m "feat(projects): file attachments via Supabase Storage"
```

## Task 6.4 — Montar paneles en ProjectDetails

**Archivo:** `src/components/ProjectDetails.tsx`, `src/App.tsx`

**Paso 1.** En `ProjectDetails.tsx`, importar los paneles y extender props:
```ts
import { ProjectInfoPanel } from './ProjectInfoPanel';
import { ProjectFiles } from './ProjectFiles';
```
```ts
interface ProjectDetailsProps {
  project: Project;
  tasks: Task[];
  onAddRuleClick: () => void;
  onEditProject: () => void;
  onDeleteProject: () => void;
  onUpdateProject: (updated: Project) => void;   // NUEVO
  onTaskClick: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
}
```
Añadir `onUpdateProject` a la desestructuración de props del componente.

**Paso 2.** Montar los paneles justo después del bloque `project-header-row` (cerrar el
`</div>` de la fila de header, antes de "Control Filters Bar"):
```tsx
      <ProjectInfoPanel project={project} onUpdateProject={onUpdateProject} />
      <ProjectFiles projectId={project.id} />
```

**Paso 3.** En `src/App.tsx`, pasar `onUpdateProject` al render de `ProjectDetails`:
```tsx
          <ProjectDetails
            project={activeProject}
            tasks={tasks}
            onAddRuleClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
            onEditProject={() => { setEditingProject(activeProject); setProjectModalOpen(true); }}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            onTaskClick={(task) => { setEditingTask(task); setTaskModalOpen(true); }}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
```
> `handleUpdateProject` ya existe (Task 4.1).

**Verificación:**
```bash
npm run build
```
Compila. Manual (`npm run dev`): abrir un proyecto muestra panel de estado/fechas/notas/
links y sección de archivos; editar notas/links persiste (recargar lo confirma); subir un
archivo lo lista y permite descargar/borrar.

**Commit:**
```bash
git add src/components/ProjectDetails.tsx src/App.tsx
git commit -m "feat(projects): mount info and files panels in project details"
```

## Task 6.5 — Dashboard: badge de estado + orden; Settings: cerrar sesión

**Archivos:** `src/components/Dashboard.tsx`, `src/components/Settings.tsx`, `src/App.tsx`

**Paso 1.** En `Dashboard.tsx`, importar tipo y añadir helpers de estado. Tras la línea
`const focusHours = ...`:
```ts
  const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Activo', color: '#227A37', bg: '#EAF7ED' },
    paused: { label: 'En pausa', color: '#B26A00', bg: '#FFF3E0' },
    done:   { label: 'Terminado', color: '#5A6472', bg: '#ECEFF3' },
  };
  const statusRank: Record<string, number> = { active: 0, paused: 1, done: 2 };
  const sortedProjects = [...projects].sort((a, b) => statusRank[a.status] - statusRank[b.status]);
```

**Paso 2.** Cambiar `projects.map((project) =>` por `sortedProjects.map((project) =>` en la
lista de tarjetas. Dentro de `project-card-header`, junto al `<h3>`, añadir el badge:
```tsx
                <div className="project-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="project-name">{project.name}</h3>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    color: STATUS_META[project.status].color,
                    backgroundColor: STATUS_META[project.status].bg,
                  }}>
                    {STATUS_META[project.status].label}
                  </span>
                </div>
```

**Paso 3.** En `Settings.tsx`, extender props con `onSignOut` y añadir botón. Cambiar la
interfaz:
```ts
interface SettingsProps {
  settings: SettingsType;
  onUpdateSettings: (newSettings: SettingsType) => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => boolean;
  onSignOut: () => void;   // NUEVO
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}
```
Añadir `onSignOut` a la desestructuración. Actualizar el copy de la sección de respaldo
(línea ~181-183) para reflejar la nube:
```tsx
          <p className="settings-desc">
            Tus datos se guardan en la nube y se sincronizan entre tus dispositivos.
            Puedes exportar un respaldo JSON o importar datos desde otro lugar.
          </p>
```
Y añadir, al final del `settings-container` (después de la sección APK), una sección de
cuenta:
```tsx
        <section className="settings-section">
          <h3 className="settings-title">👤 Cuenta</h3>
          <p className="settings-desc">Cierra sesión en este dispositivo.</p>
          <button className="btn btn-outline" onClick={onSignOut}>Cerrar sesión</button>
        </section>
```

**Paso 4.** En `src/App.tsx`: quitar el `void signOut;` temporal del Task 3.3 y pasar la
prop al render de Settings:
```tsx
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onSignOut={signOut}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
```

**Verificación:**
```bash
npm run build
```
Compila. Manual: Dashboard muestra badges de estado y ordena activos primero; Settings
tiene "Cerrar sesión" que devuelve al Login.

**Commit:**
```bash
git add src/components/Dashboard.tsx src/components/Settings.tsx src/App.tsx
git commit -m "feat(ui): project status badges, sorting and sign-out"
```

---

# Phase 7 — PWA

## Task 7.1 — Iconos + vite-plugin-pwa

**Archivos:** `public/pwa-icon.svg`, `pwa-assets.config.ts`, `vite.config.ts`

**Paso 1.** Crear `public/pwa-icon.svg` (rayo naranja sobre blanco):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#FF6B00"/>
  <path d="M288 64 152 280h84l-28 168 160-232h-92z" fill="#fff"/>
</svg>
```

**Paso 2.** Crear `pwa-assets.config.ts`:
```ts
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/pwa-icon.svg'],
});
```

**Paso 3.** Generar los PNG:
```bash
npm run icons
```
Esperado: crea `public/pwa-192x192.png`, `public/pwa-512x512.png`,
`public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`,
`public/favicon.ico`.

**Paso 4.** Reemplazar `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'gestorprojects',
        short_name: 'Gestor',
        description: 'Gestor de proyectos personal: tareas, pomodoro, calendario y más.',
        theme_color: '#FF6B00',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'es',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/auth/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('supabase.co'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
```

**Verificación:**
```bash
npm run build
npm run preview
```
En el navegador (preview), DevTools → Application → Manifest: muestra `gestorprojects` con
iconos. Application → Service Workers: hay uno activo. En Chrome aparece el botón "Instalar".

**Commit:**
```bash
git add public/pwa-icon.svg public/pwa-192x192.png public/pwa-512x512.png public/maskable-icon-512x512.png public/apple-touch-icon-180x180.png public/favicon.ico pwa-assets.config.ts vite.config.ts package.json package-lock.json
git commit -m "feat(pwa): installable PWA with manifest, icons and service worker"
```

---

# Phase 8 — Deploy (Vercel + GitHub)

## Task 8.1 — Config SPA + conectar Vercel

**Archivo:** `vercel.json`

**Paso 1.** Crear `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Paso 2.** Commit + push:
```bash
git add vercel.json
git commit -m "chore(deploy): add Vercel SPA rewrites"
git push origin main
```

**Paso 3.** En https://vercel.com (login con GitHub): Add New → Project → importar el repo
`gestorprojects`. Framework preset detecta **Vite**. Build `npm run build`, output `dist`
(por defecto).

**Paso 4.** En el wizard, Environment Variables → añadir:
- `VITE_SUPABASE_URL` = (tu Project URL)
- `VITE_SUPABASE_ANON_KEY` = (tu anon key)

Aplicar a Production + Preview. Deploy.

**Paso 5.** En Supabase → Authentication → URL Configuration → añadir la URL de Vercel
(`https://<proyecto>.vercel.app`) a **Site URL** y **Redirect URLs** (para que el reset de
contraseña redirija bien).

**Verificación (manual):**
1. Abrir la URL de Vercel en la PC → Login → entra y ves tus proyectos (los mismos de
   Supabase).
2. Abrir la misma URL en el teléfono → Login → instala como PWA (Añadir a pantalla de
   inicio) → crear una tarea.
3. En la PC, enfocar la ventana → la tarea creada en el teléfono aparece. **Sync OK.**

**Commit final / tag:**
```bash
git tag v1.0-sync
git push origin v1.0-sync
```

---

## Resumen de verificación end-to-end (criterios de aceptación del spec)

| # | Criterio | Cómo se verifica |
|---|----------|------------------|
| 1 | Login en PC y teléfono | Task 8.1 pasos 1–2 de verificación |
| 2 | Crear en un dispositivo → aparece en el otro | Task 4.2 + 8.1 |
| 3 | Proyecto guarda cliente/estado/fechas/notas/links/archivos | Task 6.1–6.4 |
| 4 | Tareas/pomodoro/calendario/settings sincronizan | Task 4.1 |
| 5 | Import 1-vez de datos locales | Task 5.2 |
| 6 | Instalable como PWA | Task 7.1 |
| 7 | Desplegada en Vercel | Task 8.1 |
| 8 | Pagos ausentes, modelo compatible | Sin tabla payments; FK project_id lista |

## Pendiente explícito (post-v1, fuera de este plan)

- Módulo de pagos (PayPal + manual) — esquema en spec §12.
- Eliminar el bloque "Generar APK (Capacitor)" de Settings si se decide PWA-only.
