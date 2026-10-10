# Perfiles de Sesión y Guía de Outreach

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restringir las sesiones de Aranza y Guillermo a solo Dashboard y Outreach (ocultando Calendario, Facturación, Ajustes), aplicar tema rosa para Aranza, agregar pestaña de guía paso a paso para outreach, y subir el manual de outreach como recurso.

**Architecture:** Se aprovecha el flag `isAdmin` ya existente para filtrar navegación y renderizado condicional. Se agrega `currentProfile` al estado global de App.tsx para detectar quién es el usuario actual y aplicar CSS variables dinámicas por usuario. La guía de outreach se agrega como una tercera pestaña dentro del componente Outreach.

**Tech Stack:** React 19, TypeScript, CSS Variables, Supabase Storage

---

### Task 1: Filtrar navegación para no-admin

**Files:**
- Modify: `src/components/Sidebar.tsx:38-47`
- Modify: `src/components/BottomNav.tsx:35-44`

**Step 1: Restringir nav items en Sidebar.tsx**

Cuando `isAdmin` es false, solo mostrar Dashboard y Outreach. El nav array pasa a ser:

```typescript
const nav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  ...(isAdmin
    ? [
        { id: 'outreach' as NavTab, label: 'Outreach', Icon: Send },
        { id: 'finances' as NavTab, label: 'Finanzas', Icon: DollarSign },
        { id: 'clients' as NavTab, label: 'Clientes', Icon: Users },
        { id: 'calendar' as NavTab, label: 'Calendario', Icon: Calendar },
        { id: 'pomodoro' as NavTab, label: 'Pomodoro', Icon: Timer },
      ]
    : [{ id: 'outreach' as NavTab, label: 'Outreach', Icon: Send }]
  ),
  ...(isAdmin ? [{ id: 'admin' as NavTab, label: 'Admin', Icon: Shield }] : []),
];
```

**Step 2: Restringir nav items en BottomNav.tsx**

Misma lógica — cuando no es admin, solo mostrar Proyectos y Outreach:

```typescript
const items: { tab: NavTab; label: string; Icon: React.ComponentType<{ size?: number }>; activeWhen?: NavTab[] }[] = [
  { tab: 'dashboard', label: 'Proyectos', Icon: LayoutDashboard, activeWhen: ['dashboard', 'project'] },
  ...(isAdmin
    ? [
        { tab: 'outreach' as NavTab, label: 'Outreach', Icon: Send },
        { tab: 'clients' as NavTab, label: 'Clientes', Icon: Users },
        { tab: 'calendar' as NavTab, label: 'Calendario', Icon: Calendar },
        { tab: 'pomodoro' as NavTab, label: 'Pomodoro', Icon: Timer },
        { tab: 'finances' as NavTab, label: 'Facturas', Icon: DollarSign },
      ]
    : [{ tab: 'outreach' as NavTab, label: 'Outreach', Icon: Send }]
  ),
  ...(isAdmin ? [{ tab: 'admin' as NavTab, label: 'Admin', Icon: Shield }] : []),
  ...(isAdmin ? [{ tab: 'settings' as NavTab, label: 'Ajustes', Icon: Settings }] : []),
];
```

**Step 3: Verificar que los cambios compilan**

Run: `npm run build`
Expected: Build exitoso sin errores

**Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/components/BottomNav.tsx
git commit -m "feat: hide calendar, finances, settings for non-admin users"
```

---

### Task 2: Agregar `currentProfile` al estado global y aplicar tema rosa para Aranza

**Files:**
- Modify: `src/App.tsx:86-88,150-160`
- Modify: `src/index.css:30-58` (agregar variables CSS para user-aranza)

**Step 1: Agregar `currentProfile` state en App.tsx**

Después de `isAdmin` (line 86-88), agregar:

```typescript
const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
```

En el effect que carga profiles (lines 150-160), actualizar:

```typescript
db.fetchProfiles().then((p) => {
  setProfiles(p);
  const me = p.find((pr) => pr.id === user.id);
  setIsAdmin(me?.role === 'admin');
  setCurrentProfile(me ?? null);
}).catch(() => {});
```

**Step 2: Agregar effect para aplicar CSS variables por usuario**

Después del effect de profiles (después de line 160), agregar:

```typescript
useEffect(() => {
  if (!currentProfile) return;
  const root = document.documentElement;

  // Resetear primero (quitar variables dinámicas previas)
  root.style.removeProperty('--gp-accent');
  root.style.removeProperty('--gp-accent-hover');
  root.style.removeProperty('--gp-accent-subtle');
  root.style.removeProperty('--gp-accent-ring');
  root.style.removeProperty('--gp-accent-glow');

  if (currentProfile.displayName === 'Aranza') {
    root.style.setProperty('--gp-accent', '#EC4899');
    root.style.setProperty('--gp-accent-hover', '#DB2777');
    root.style.setProperty('--gp-accent-subtle', 'rgba(236, 72, 153, 0.08)');
    root.style.setProperty('--gp-accent-ring', 'rgba(236, 72, 153, 0.25)');
    root.style.setProperty('--gp-accent-glow', '0 0 20px rgba(236, 72, 153, 0.15)');
  }
}, [currentProfile]);
```

**Step 3: Build y verificar**

Run: `npm run build`
Expected: Build exitoso

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add per-user accent color (pink for Aranza)"
```

---

### Task 3: Agregar pestaña "Guía de Outreach" paso a paso

**Files:**
- Modify: `src/components/Outreach.tsx:88-101` (agregar state para activeTab incluyendo 'guia')
- Modify: `src/components/Outreach.tsx:287-303` (agregar tercer tab en el header)
- Add content section for the guide before the pipeline (after stat cards, before pipeline)

**Step 1: Agregar 'guia' al tipo de activeTab**

Cambiar línea 90:
```typescript
const [activeTab, setActiveTab] = useState<'outreach' | 'comisiones' | 'guia'>('outreach');
```

**Step 2: Agregar el tercer tab en el header**

Después del tab de Comisiones (después de line 303), agregar:

```typescript
<button onClick={() => setActiveTab('guia')}
  className={`outreach-tab ${activeTab === 'guia' ? 'active' : 'inactive'}`}>
  <BookOpen size={12} className="outreach-tab-icon" />
  Guía
</button>
```

Necesito importar `BookOpen` de lucide-react en la línea 3.

**Step 3: Agregar la sección de guía antes del pipeline**

Después de la sección `{activeTab === 'outreach' && (` (antes del pipeline), agregar la sección de guía completa con pasos detallados.

El contenido de la guía debe cubrir:
- Cómo identificar leads en Instagram
- Cómo enviar el primer DM (script de apertura)
- Cómo hacer seguimiento
- Cómo presentar propuesta
- Cómo cerrar el deal
- Enlace/Referencia al manual completo

**Step 4: Verificar build**

Run: `npm run build`
Expected: Build exitoso

**Step 5: Commit**

```bash
git add src/components/Outreach.tsx
git commit -m "feat: add outreach step-by-step guide tab"
```

---

### Task 4: Subir manual de outreach como recurso

**Files:**
- Create: `public/manual-outreach.md` o usar Supabase Storage

**Step 1: Preguntar al usuario por el archivo del manual**

El usuario mencionó "subirles el recurso donde esta el manual de outreach". Preguntar:
- ¿El manual es un archivo existente en el sistema?
- ¿O necesita ser creado desde cero?

Si existe, subirlo a Supabase storage o colocarlo en `public/`.
Si no existe, crearlo con el contenido de los scripts actuales + pasos detallados.

---

### Task 5: Agregar enlace al manual en la guía de Outreach

**Files:**
- Modify: `src/components/Outreach.tsx` (agregar sección de enlace al manual)

**Step 1: En la pestaña Guía, agregar sección de "Manual Completo"**

Debajo de los pasos rápidos, agregar una sección que enlace al manual:

```typescript
{activeTab === 'guia' && (
  <div className="outreach-guide-page">
    {/* Guía paso a paso */}
    ...
    {/* Enlace al manual completo */}
    <div className="gp-surface gp-border-line gp-rounded-md gp-p-4 gp-mt-4">
      <h3>📘 Manual de Outreach Completo</h3>
      <p>Descarga el manual completo con todos los scripts, estrategias y ejemplos.</p>
      <a href="/manual-outreach.md" target="_blank">Abrir Manual →</a>
    </div>
  </div>
)}
```

---

## Summary

| Task | Files | Description |
|------|-------|-------------|
| 1 | `Sidebar.tsx`, `BottomNav.tsx` | Filtrar navegación para no-admin |
| 2 | `App.tsx` | Tema rosa para Aranza vía CSS vars |
| 3 | `Outreach.tsx` | Pestaña "Guía" con pasos de outreach |
| 4 | `public/manual-outreach.md` o Supabase | Subir manual de outreach |
| 5 | `Outreach.tsx` | Enlace al manual en la guía |
