# BlessProjects — Gestor de Proyectos

Stack: Vite + React + TypeScript + Supabase + Tailwind
Deploy: Vercel (SPA, sin servidor propio)

> Proyecto nuevo creado desde cero (copia de la estructura rediseñada de Gestorprojects,
> renombrado a BlessProjects). Backend Supabase nuevo, repo GitHub nuevo, proyecto Vercel nuevo.

## Comandos

- `dev`: npm run dev
- `build`: npm run build
- `test`: npm run test (vitest)
- `lint`: npx eslint .
- `deploy`: push a main → Vercel auto-deploy

## Contexto del Proyecto

- Sistema de gestión de proyectos con facturación profesional a clientes
- No hay tracking de ingresos/gastos — solo facturación mensual por items (€7.50/video, €3.00/imagen)
- Tabla `invoices` en Supabase con JSONB items, status (pendiente/pagada), total
- Template de impresión profesional HTML con CSS para entregar al cliente
- Flujo: seleccionar proyecto con cliente → crear factura mensual con items → marcar pagado → imprimir
- Tema: Glass/Premium esmeralda oscuro (tokens `--gp-*` en `src/index.css`)
- Módulos podados (no reintroducir): Pomodoro, Outreach — ver histórico en Gestorprojects

## Entornos / Credenciales

- `.env.local` (gitignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Fallbacks de env en `src/lib/supabase.ts`: `VITE_*` → `NEXT_PUBLIC_blessprojects_*` → `blessprojects_*`
- Vercel inyecta `NEXT_PUBLIC_blessprojects_*` / `blessprojects_*` (naming automático del CLI)
- NUNCA commitear: `.env.local`, `.env.production`, `.env.vercel`, `.env.supabase`, `supabase/.temp/`

## Archivos Clave

- `src/components/Finances.tsx` — facturación (sin income/expense)
- `src/types.ts` — interfaces Invoice, InvoiceLineItem, InvoiceStatus
- `src/services/db.ts` — upsertInvoice, deleteInvoice, fetchAllData
- `src/lib/mappers.ts` — rowToInvoice, invoiceToRow
- `src/index.css` — tema Glass esmeralda + tokens
- `supabase/schema.sql` — schema completo
- `supabase/migrations/` — 5 migraciones incrementales
- `SETUP.md` — guía paso a paso de puesta en marcha

## Reglas de Trabajo

- Commits: solo si el usuario lo pide. Estilo convencional en minúsculas (`feat:`, `fix:`, `rm:`)
- Correr `npm run build` + `npm run test` + `npx eslint .` antes de dar por terminado un cambio
- Archivos con mojibake/acentos: editar con herramientas que respeten UTF-8 (Read/Edit), no Get-Content de PS
