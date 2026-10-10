# gestorprojects — Diseño v1: Sync multi-dispositivo + proyectos enriquecidos

**Fecha:** 2026-06-07
**Estado:** Propuesto (pendiente de aprobación)
**Autor:** Angelo + Claude

---

## 1. Contexto y estado actual

`gestorprojects` es una app **React 19 + Vite 8 + TypeScript, solo frontend**. Todos los
datos viven en `localStorage` (claves `gp_projects`, `gp_tasks`, `gp_sessions`,
`gp_settings`, `gp_theme`) — ver `src/App.tsx:135`. Esto es **por-dispositivo**: el
teléfono y la PC tienen datos distintos, sin sincronización.

Ya existe y funciona:
- Dashboard, ProjectDetails (tablero por estado de tarea), Pomodoro, Calendar
  (embed de Google Calendar), Settings.
- Layout responsive (Sidebar en desktop, BottomNav en móvil).
- Export/Import de respaldo JSON (`handleExportData` / `handleImportData`).

Modelo de datos actual (`src/types.ts`): `Project` (flaco: name, description, color,
createdAt), `Task` (+ `SubTask[]`, tags), `PomodoroSession`, `Settings`.

No existe: backend, cuentas/login, base de datos en la nube, pagos.

## 2. Objetivo de v1

Convertir la app actual en una herramienta **personal sincronizada en la nube**, sin
cambiar su aspecto, con dos ejes:

1. **Sync con login.** Una sola cuenta (Angelo). Los datos viven en la nube y se
   sincronizan entre teléfono y PC. Instalable como **PWA**. Desplegada en **Vercel**.
2. **Proyectos enriquecidos.** Cada proyecto deja de ser un nombre con tareas y pasa a
   contener **todo**: cliente, estado, fechas, notas/brief, links y archivos adjuntos.

## 3. Fuera de alcance de v1 (diferido)

- **Pagos** (cobro real + control). Se documenta el esquema futuro (§12) para enchufarlo
  después sin repintar, pero **no se construye**.
- Multiusuario / portal de cliente (la app es solo para Angelo).
- App nativa (la PWA cubre "en el teléfono").
- Escritura offline con resolución de conflictos. v1 lee offline desde caché; **escribir
  requiere conexión**.

## 4. Arquitectura

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  PWA (React + Vite)          │         │  Supabase (managed)          │
│  - Vercel static hosting     │  HTTPS  │  - Auth (email + password)   │
│  - vite-plugin-pwa           │ ──────▶ │  - Postgres (datos + RLS)    │
│  - capa de datos Supabase    │ ◀────── │  - Realtime (postgres_changes)│
│  - caché localStorage        │ realtime│  - Storage (archivos, RLS)   │
└─────────────────────────────┘         └──────────────────────────────┘
```

- **Frontend:** sigue siendo Vite estático. Se añade `@supabase/supabase-js` y
  `vite-plugin-pwa`. La UI no cambia; cambia **de dónde salen los datos**.
- **Backend:** Supabase gestionado (free tier). No escribimos servidor propio.
- **Hosting:** Vercel (build `npm run build`, output `dist`).

## 5. Auth

- **Proveedor:** Supabase Auth, método **email + password**.
- **Una sola cuenta** (el correo de Angelo). Flujo: Angelo se registra una vez; luego se
  **deshabilitan los registros nuevos** en Supabase (Auth → Providers → "Allow new users
  to sign up" = off). Aun así, RLS garantiza que solo el dueño ve sus datos.
- **Sesión persistente:** `supabase-js` guarda la sesión en `localStorage`; en la PWA
  queda logueado entre aperturas (login una vez por dispositivo).
- **Pantalla de login:** email + password + botón "recuperar contraseña" (reset por
  correo de Supabase). Sin registro público visible.
- **Gate de acceso:** la app es pública en Vercel; sin sesión válida solo se muestra el
  login. Ninguna pantalla de datos renderiza sin sesión.

## 6. Modelo de datos (Postgres)

Todas las tablas tienen `user_id uuid` y **Row Level Security (RLS)** activado, con una
política única por tabla: `auth.uid() = user_id` para SELECT/INSERT/UPDATE/DELETE.

### `projects`
| columna       | tipo        | notas |
|---------------|-------------|-------|
| id            | uuid PK     | `default gen_random_uuid()` |
| user_id       | uuid        | `not null`, FK `auth.users` |
| name          | text        | `not null` |
| description   | text        | |
| color         | text        | `not null` (hex) |
| client        | text        | cliente/contacto (FloxAI, Crumpizza, …) |
| status        | text        | `not null default 'active'`, check `('active','paused','done')` |
| start_date    | date        | nullable |
| due_date      | date        | nullable (deadline) |
| notes         | text        | brief/docs (markdown plano) |
| links         | jsonb       | `not null default '[]'` → `[{id, label, url}]` |
| created_at    | timestamptz | `not null default now()` |

### `tasks`
| columna     | tipo        | notas |
|-------------|-------------|-------|
| id          | uuid PK     | |
| user_id     | uuid        | `not null` |
| project_id  | uuid        | `not null`, FK `projects` `on delete cascade` |
| title       | text        | `not null` |
| description | text        | |
| status      | text        | check `('todo','in_progress','review','done')` |
| priority    | text        | check `('low','medium','high')` |
| due_date    | date        | nullable |
| tags        | jsonb       | `not null default '[]'` (array de strings) |
| subtasks    | jsonb       | `not null default '[]'` → `[{id,title,completed}]` |
| created_at  | timestamptz | `not null default now()` |

> `subtasks` y `tags` se guardan como JSON dentro de la tarea (igual que el modelo actual
> en memoria) — evita joins y coincide con el código existente.

### `pomodoro_sessions`
| columna      | tipo        | notas |
|--------------|-------------|-------|
| id           | uuid PK     | |
| user_id      | uuid        | `not null` |
| project_id   | uuid        | FK `projects` `on delete set null` (conserva historial) |
| project_name | text        | `not null` (snapshot, como hoy) |
| minutes      | int         | `not null` |
| date         | date        | `not null` |

### `settings` (1 fila por usuario)
| columna             | tipo | default |
|---------------------|------|---------|
| user_id             | uuid PK FK `auth.users` | |
| focus_time          | int  | 25 |
| break_time          | int  | 5 |
| long_break_time     | int  | 15 |
| daily_goal_minutes  | int  | 120 |
| google_calendar_url | text | `''` |

### `project_files` (metadata; binarios en Storage)
| columna      | tipo        | notas |
|--------------|-------------|-------|
| id           | uuid PK     | |
| user_id      | uuid        | `not null` |
| project_id   | uuid        | `not null`, FK `projects` `on delete cascade` |
| file_name    | text        | nombre original |
| storage_path | text        | ruta en el bucket |
| size_bytes   | bigint      | |
| mime_type    | text        | |
| uploaded_at  | timestamptz | `not null default now()` |

**Storage:** bucket privado `project-files`. Convención de ruta:
`{user_id}/{project_id}/{uuid}-{nombre}`. Política de Storage: el usuario solo opera
objetos cuya primera carpeta es su `auth.uid()`
(`(storage.foldername(name))[1] = auth.uid()::text`). Al borrar un proyecto, se borran
sus filas `project_files` (cascade) **y** sus objetos en Storage (borrado explícito en la
capa de datos antes del delete del proyecto).

## 7. Capa de sync

Archivos nuevos:
- `src/lib/supabase.ts` — `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`.
- `src/services/db.ts` — funciones CRUD tipadas por entidad (projects, tasks, sessions,
  settings, files), devolviendo filas tipadas con los `types.ts`.
- `src/hooks/useAuth.ts` — estado de sesión (user, loading, signIn, signOut).

Comportamiento:
- **Carga:** cuando hay sesión, fetch en paralelo de projects/tasks/sessions/settings.
- **Escritura:** actualización **optimista** del estado local + `upsert`/`delete` en
  Supabase; si falla, revertir + aviso (toast).
- **Realtime (best-effort):** suscripción `postgres_changes` a las tablas filtradas por
  `user_id`; al recibir evento, mergear en estado. Un cambio en el teléfono aparece en la
  PC en vivo.
- **Baseline confiable:** refetch en `focus` / `visibilitychange` de la ventana, por si
  realtime se cae. Esto garantiza consistencia aunque realtime falle.
- **Caché:** espejar lo cargado en `localStorage` (mismas claves `gp_*`) para **primer
  render instantáneo + lectura offline**. Al abrir: hidratar desde caché, luego refrescar
  desde red.

`App.tsx` cambia sus llamadas síncronas a `localStorage` por las funciones async de
`db.ts`. La forma del estado en memoria (projects, tasks, …) **no cambia**, así que los
componentes hijos no se tocan salvo los nuevos campos de proyecto (§9).

## 8. Migración de datos locales existentes

Angelo ya tiene datos en `localStorage` (proyecto FloxAI + tareas). En el **primer login
con nube vacía** (cero filas en `projects`): mostrar prompt *"Detectamos datos locales —
¿importar a la nube?"*. Si acepta, leer `gp_projects`/`gp_tasks`/`gp_sessions`/
`gp_settings`, mapear a las nuevas columnas (campos nuevos quedan en default: status
`active`, client/notes vacíos, links `[]`) y hacer bulk insert. Operación **una sola
vez**. Reusa la lógica de validación de `handleImportData`.

## 9. Proyectos enriquecidos (UI)

`ProjectDetails` gana secciones nuevas (mismo lenguaje visual actual):
- **Encabezado:** cliente, selector de estado (activo / en pausa / terminado), fecha
  inicio y deadline.
- **Notas / brief:** textarea (markdown plano) autoguardado.
- **Links:** lista editable de `{label, url}` (añadir/quitar/abrir).
- **Archivos:** subir (drag-drop o botón), listar, descargar, borrar. Sube a Storage,
  registra en `project_files`.

`ProjectModal` (crear/editar) gana: cliente, estado, fechas. Notas/links/archivos se
editan dentro de ProjectDetails (no en el modal, para no recargarlo).

`Dashboard`: filtro/orden por estado de proyecto (activos primero); badge de estado y
deadline por tarjeta.

`types.ts`: extender `Project` con `client?`, `status`, `startDate?`, `dueDate?`,
`notes?`, `links: ProjectLink[]`; nuevos tipos `ProjectLink` y `ProjectFile`.

## 10. PWA + deploy

- **`vite-plugin-pwa`** (`registerType: 'autoUpdate'`):
  - Manifest: `name "gestorprojects"`, `short_name`, `theme_color "#FF6B00"`,
    `background_color`, display `standalone`, iconos 192/512 (incl. maskable).
  - Workbox: precache del app shell. **Network-first / NetworkOnly** para llamadas a
    Supabase (no cachear API ni Storage).
  - Iconos: generar PNG 192/512 con la marca naranja (tarea de assets).
- **Vercel (plan Hobby, gratis), conectado a GitHub:** se enlaza el repo
  `gestorprojects`; cada `git push` a `main` dispara un deploy automático. Framework
  Vite, build `npm run build`, output `dist`, SPA fallback a `index.html`. URL en
  subdominio `*.vercel.app` (o dominio propio). Costo $0 (Hobby = uso personal/no
  comercial, que es el caso). Supabase free tier también $0 → **costo total v1 = $0**.

## 11. Config / secrets

- `.env.local` (en `.gitignore`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`  ← pública-segura: RLS hace cumplir el acceso.
- Mismas dos vars en **Vercel → Environment Variables**.
- La `service_role` key **nunca** va al frontend.

## 12. Pagos (diferido — esquema de referencia, NO se construye en v1)

Cuando se retome (decidido: PayPal API + registros manuales tipo Binance USDT / Zelle /
transferencia):

### `payments` (futuro)
`id`, `user_id`, `project_id` (FK), `amount numeric`, `currency text`,
`method text ('paypal' | 'manual')`, `status text ('pending' | 'paid' | 'cancelled')`,
`link text` (link de pago/checkout), `due_date date`, `paid_at timestamptz`,
`note text`, `created_at timestamptz`.

PayPal añadiría una función serverless (Vercel o Supabase Edge) para el **webhook** que
marca `status = 'paid'`. Los pagos manuales se registran a mano con su link/comprobante.
El diseño relacional actual (project_id) ya deja el hueco listo.

## 13. Riesgos y notas honestas

- **Free tier Supabase:** pausa el proyecto tras ~1 semana de inactividad (despierta al
  primer request). Para uso personal, irrelevante.
- **Realtime es best-effort.** El refetch-al-enfocar es el piso confiable; si realtime da
  problemas, se puede desactivar sin perder consistencia.
- **Sin escritura offline.** Editar requiere conexión; offline solo lectura desde caché.
- **Storage cuenta contra 1 GB** del free tier. Archivos pesados lo consumen — vigilar.
- **Sesión en localStorage:** si Angelo limpia datos del navegador, debe re-loguear (no
  pierde datos en la nube).

## 14. Criterios de aceptación de v1

1. Login con la cuenta de Angelo en PC **y** en teléfono.
2. Crear/editar un proyecto en el teléfono → aparece en la PC (realtime o al refrescar).
3. Cada proyecto guarda: cliente, estado, fecha inicio + deadline, notas/brief, links y
   archivos adjuntos (subir/descargar/borrar).
4. Tareas, pomodoro, calendario y settings funcionan igual que antes, pero sincronizados.
5. Los datos locales actuales se importan una vez a la nube sin pérdida.
6. La app se instala como PWA en teléfono y desktop.
7. Desplegada y accesible en una URL de Vercel.
8. Pagos **no** presentes, pero el esquema documentado no contradice el modelo construido.

## 15. Único paso siguiente permitido

Tras aprobación de este spec → invocar **writing-plans** para el plan de implementación.
Ninguna otra transición.
