# Gestorprojects v2 — Rediseño UI + Backend overhaul

**Fecha:** 2026-07-18  
**Estado:** Borrador  
**Autor:** Angelo + Claude  

---

## 1. Contexto y estado actual

Gestorprojects es una app React 19 + Vite 8 + TypeScript + Supabase, desplegada como PWA en Vercel. Actualmente funcional con:

- Dashboard con stats y tarjetas de proyecto
- Vista de proyecto (kanban/lista) con tareas, subtareas, etiquetas
- Pomodoro timer con sesiones
- Calendario con Google Calendar embed
- Facturación profesional (invoices mensuales por items)
- Outreach/leads pipeline
- Admin panel para compartir proyectos
- Sync multi-dispositivo via Supabase + Realtime
- PWA instalable

Problemas actuales:

| Área | Problema |
|------|----------|
| **UI** | Estilo básico, inline styles dispersos, sin design system, padding/spacing inconsistente, micro-interacciones ausentes |
| **Backend (db.ts)** | Manejo de errores básico, sin tipado fuerte en queries, validación mínima |
| **MCP Server** | Monolito de 764 líneas, ADMIN_UID hardcodeado, service_role key expuesta, sin tests, sin logging, tools faltantes |
| **Analytics** | No existe — el dashboard solo muestra stats planos (total proyectos, tareas, horas) |

---

## 2. Objetivo

Transformar Gestorprojects en una herramienta profesional con:

1. **Design system completo** (colores, tipografía, spacing, animaciones)
2. **UI moderna** estilo Linear/Vercel — cards limpias, glassmorphism, micro-interacciones
3. **Backend robusto** — db.ts tipado, MCP server modular
4. **Analytics/insights** — dashboard enriquecido con gráficos de productividad

---

## 3. Fuera de alcance (v2)

- Pagos/cobro real (diferido a v3, esquema ya documentado)
- Portal de cliente (solo Angelo + brothers)
- App nativa (PWA cubre mobile)
- Modo offline completo (solo lectura desde caché)

---

## 4. Arquitectura propuesta

```
┌──────────────────────────────────────────┐
│  Frontend (React 19 + Vite 8)            │
│  ┌───────────┐ ┌──────────────────────┐  │
│  │   Design   │ │   Components         │  │
│  │   System   │ │   (22 componentes)   │  │
│  │  (tokens)  │ │                      │  │
│  └───────────┘ └──────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │   Services (db.ts) — tipado fuerte │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
           ↕ HTTPS + Realtime
┌──────────────────────────────────────────┐
│  Supabase                                │
│  ┌────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Auth   │ │ Postgres │ │ Storage   │  │
│  │ (1 acct)│ │ (9 tabs) │ │ (archivos)│  │
│  └────────┘ └──────────┘ └───────────┘  │
└──────────────────────────────────────────┘
           ↕ stdio (MCP)
┌──────────────────────────────────────────┐
│  gestorprojects-mcp (refactorizado)      │
│  handlers/ | services/ | validation/     │
│  Zod schemas | logging | 30+ tools      │
└──────────────────────────────────────────┘
```

---

## 5. Design System (CSS Custom Properties)

### 5.1 Nueva paleta de colores

```css
:root {
  /* Base */
  --gp-bg: #0B0B0F;
  --gp-surface: #141417;
  --gp-surface-hover: #1C1C21;
  --gp-surface-active: #222228;

  /* Borders */
  --gp-border: #232329;
  --gp-border-hover: #34343C;

  /* Text */
  --gp-text-primary: #EDEDEF;
  --gp-text-secondary: #868690;
  --gp-text-tertiary: #5E5E6B;

  /* Accent */
  --gp-accent: #F97316;
  --gp-accent-hover: #EA580C;
  --gp-accent-subtle: rgba(249, 115, 22, 0.08);
  --gp-accent-ring: rgba(249, 115, 22, 0.25);
  --gp-accent-glow: 0 0 20px rgba(249, 115, 22, 0.15);

  /* Semantic */
  --gp-green: #22C55E;
  --gp-green-bg: rgba(34, 197, 94, 0.1);
  --gp-blue: #3B82F6;
  --gp-blue-bg: rgba(59, 130, 246, 0.1);
  --gp-red: #EF4444;
  --gp-red-bg: rgba(239, 68, 68, 0.1);
  --gp-yellow: #EAB308;
  --gp-yellow-bg: rgba(234, 179, 8, 0.1);

  /* Shadows */
  --gp-shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --gp-shadow-sm: 0 2px 8px rgba(0,0,0,0.35);
  --gp-shadow-md: 0 4px 16px rgba(0,0,0,0.4);
  --gp-shadow-lg: 0 8px 32px rgba(0,0,0,0.5);
  --gp-shadow-glow: 0 0 24px rgba(249,115,22,0.08);
}
```

### 5.2 Tipografía

| Token | Valor |
|-------|-------|
| Font base | `Inter`, -apple-system, sans-serif |
| Font mono | `JetBrains Mono`, monospace |
| `--gp-text-xs` | `0.7rem` (labels, badges) |
| `--gp-text-sm` | `0.8rem` (description, meta) |
| `--gp-text-base` | `0.88rem` (body) |
| `--gp-text-lg` | `1rem` (card titles) |
| `--gp-text-xl` | `1.2rem` (section titles) |
| `--gp-text-2xl` | `1.5rem` (page titles) |
| `--gp-text-3xl` | `2rem` (hero stats) |

### 5.3 Spacing scale

`--gp-space-1` (4px) → `--gp-space-2` (8px) → `--gp-space-3` (12px) → `--gp-space-4` (16px) → `--gp-space-5` (20px) → `--gp-space-6` (24px) → `--gp-space-8` (32px) → `--gp-space-10` (40px)

### 5.4 Border radius

| Token | Valor |
|-------|-------|
| `--gp-radius-sm` | 6px |
| `--gp-radius-md` | 10px |
| `--gp-radius-lg` | 14px |
| `--gp-radius-xl` | 20px |
| `--gp-radius-full` | 9999px |

### 5.5 Animaciones

- Duration base: `--gp-duration`: 150ms
- Ease: `--gp-ease`: cubic-bezier(0.16, 1, 0.3, 1) — "spring-like"
- Todos los componentes usan esta curva para consistencia
- Micro-interacciones: hover scale(1.02), active scale(0.98)
- Entrada de paneles: slide + fade
- Transiciones de tema: 200ms ease

---

## 6. Plan de rediseño UI (progresivo)

### 6.1 Fase 1 — Base: Design System + index.css

- Reemplazar variables CSS actuales por nuevo naming (`--gp-*`)
- Importar sistema de spacings y typografía
- Añadir animaciones globales
- **Archivo:** `src/index.css`

### 6.2 Fase 2 — Componentes core

**2a. Sidebar**
- Cleaner active states con barra indicadora
- Avatar/initials en header
- Proyectos con status dot + deadline indicator
- Collapse animado

**2b. Dashboard**
- Stats cards con glassmorphism y glow sutiles
- Project cards con hover elevation
- Status badges con iconos
- Weekly timeline visual
- Add project card mejorado

**2c. ProjectDetails (Kanban + Lista)**
- Kanban: columnas con gradient header, tarjetas con border sutil, mejor drag feedback
- Lista: rows con hover states más limpios, compactos
- Column headers con count badge estilizado
- Transiciones entre vistas

**2d. Modals (ProjectModal, TaskModal)**
- Glassmorphism background (backdrop-filter: blur)
- Slide-up animation consistente
- Header con accent bar
- Footer con botones alineados a la derecha
- Input focus states con glow

**2e. ProjectInfoPanel + ProjectFiles**
- Tabs o accordion sections
- Link cards con icono hover
- File list con progress bar
- Objetivos con track visual

**2f. Calendar, Pomodoro, Settings, Outreach**
- Calendar: grid más limpio, day cells con hover
- Pomodoro: timer circle con glow animado, sesiones del día
- Settings: grouped sections con icons
- Outreach: pipeline vertical cleaner

### 6.3 Fase 3 — Micro-interacciones

- Hover scale/lift en cards y botones
- Smooth transitions en todo cambio de estado
- Loading skeletons (ya existen, refinar)
- Empty states con ilustraciones minimalistas
- Toast notifications con slide-in (ya existe Toaster)

### 6.4 Fase 4 — Analytics Dashboard (nuevo)

Sección nueva en el Dashboard:

**Stats enriquecidos:**
- Proyectos activos vs completados (doughnut chart con SVG nativo)
- Tareas completadas por semana (bar chart con SVG nativo)
- Horas de enfoque por día (line chart con SVG nativo)
- Facturación mensual (bar chart)
- Tasa de completación de tareas

**Implementación:**
- Sin librerías externas — SVG charts nativos (componentes ligeros)
- Datos calculados desde el estado existente (tasks, sessions, invoices)
- Selector de rango (7d, 30d, 90d)

**Nuevos componentes:**
- `src/components/charts/DoughnutChart.tsx`
- `src/components/charts/BarChart.tsx`
- `src/components/charts/LineChart.tsx`
- `src/components/AnalyticsDashboard.tsx`

---

## 7. Backend: db.ts refactor

### 7.1 Tipado fuerte

- Reemplazar `safeQuery<any[]>` por tipos concretos
- Crear `QueryResult<T>` genérico
- Eliminar `Record<string, any>` en mappers

### 7.2 Errores consistentes

```ts
class AppError extends Error {
  constructor(
    message: string,
    public code: 'VALIDATION' | 'NETWORK' | 'AUTH' | 'NOT_FOUND' | 'UNKNOWN',
    public retryable: boolean = false,
  ) { super(message); }
}
```

### 7.3 Nuevas queries para analytics

```ts
export async function fetchWeeklyStats(userId: string): Promise<WeeklyStats>
export async function fetchMonthlyInvoiceTotals(userId: string): Promise<MonthlyInvoiceTotal[]>
export async function fetchPomodoroTrends(userId: string, days: number): Promise<PomodoroTrend[]>
```

---

## 8. Backend: MCP server refactor

### 8.1 Estructura de archivos

```
src/
├── index.ts                    # Entry point + server setup
├── types.ts                    # Shared types + Zod schemas
├── db.ts                       # Supabase client + queries
├── handlers/
│   ├── projects.ts             # CRUD project handlers
│   ├── tasks.ts                # CRUD task handlers
│   ├── invoices.ts             # CRUD invoice handlers
│   ├── leads.ts                # CRUD lead handlers
│   ├── sessions.ts             # Pomodoro session handlers
│   ├── profiles.ts             # Profile handlers
│   ├── files.ts                # File handlers
│   └── dashboard.ts            # Dashboard aggregator
├── lib/
│   ├── mappers.ts              # camelCase ↔ snake_case mappers (shared with frontend)
│   └── validation.ts           # Zod schemas per entity
└── __tests__/
    ├── projects.test.ts
    └── mappers.test.ts
```

### 8.2 Mejoras de seguridad

- Eliminar ADMIN_UID hardcodeado — usar auth real o pass user como parámetro
- Agregar validación con Zod en todos los inputs
- Logging estructurado (console.log con JSON tags)
- Rate limiting (opcional)

### 8.3 Tools faltantes

| Tool | Endpoint | Propósito |
|------|----------|-----------|
| `gestor_get_settings` | `settings.get` | Leer settings del usuario |
| `gestor_update_settings` | `settings.upsert` | Actualizar settings |
| `gestor_list_financial_entries` | `financial_entries.list` | Listar ingresos/gastos |
| `gestor_create_financial_entry` | `financial_entries.create` | Crear entry |
| `gestor_delete_financial_entry` | `financial_entries.delete` | Eliminar entry |
| `gestor_get_insights` | `dashboard.insights` | Métricas de analytics |

### 8.4 Logger

```ts
const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', msg, meta, ts: new Date().toISOString() })),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', msg, meta, ts: new Date().toISOString() })),
};
```

---

## 9. Migración de datos

No hay migración de datos — los mismos existen en Supabase. Solo se agregan:

- **Migration:** `20260718000001_analytics_indexes.sql` — índices para queries de analytics
- **Migration:** `20260718000002_add_shared_features.sql` — columnas para compartir proyectos

---

## 10. Criterios de aceptación

1. Design system aplicado consistentemente en todos los componentes
2. Dashboard muestra analytics (gráficos SVG de tareas, pomodoro, facturación)
3. Sidebar y bottom nav con active indicators y animaciones
4. Modals con glassmorphism y slide-up
5. Kanban con drag feedback y column styling mejorado
6. db.ts con tipos fuertes y error handling consistente
7. MCP server modular (< 200 líneas por handler), con Zod validation
8. Logging estructurado en MCP server
9. Tools faltantes implementadas (settings, financial_entries, insights)
10. Build `npm run build` y MCP `npm run build` pasan sin errores

---

## 11. Secuencia de implementación

```
Fase 1: Design System CSS + index.ts refactor
Fase 2: Componentes core (Sidebar, Dashboard, ProjectDetails)
Fase 3: Modals + InfoPanel + Files
Fase 4: Calendar + Pomodoro + Settings + Outreach
Fase 5: Analytics Dashboard (gráficos SVG)
Fase 6: Micro-interacciones + animaciones
Fase 7: MCP server refactor (modular + validation + tools faltantes)
Fase 8: db.ts tipado fuerte + nuevas queries
Fase 9: Tests + build verification
```
