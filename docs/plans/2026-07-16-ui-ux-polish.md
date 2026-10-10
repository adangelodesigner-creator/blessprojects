# UI/UX Polish — Gestorprojects

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Gestorprojects from a functional tool into a polished, intuitive experience that Angelo and his siblings can use daily without friction.

**Architecture:** Enhance the existing React 19 + Vite + Supabase PWA with micro-animations (Framer Motion), toast notifications (react-hot-toast), skeleton loading states, mobile-first responsive improvements, keyboard shortcuts, and consistent component design. Each improvement is isolated — no structural refactors, only surface-level UX enhancements that make the app feel "premium."

**Tech Stack:** Vite 8, React 19, TypeScript 6, Supabase, lucide-react, canvas-confetti (+ new: framer-motion, react-hot-toast)

---

### Task 1: Install new dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install framer-motion and react-hot-toast**

```bash
npm install framer-motion react-hot-toast
```

Expected: Packages added to `package.json` and `node_modules/`.

**Step 2: Verify dependencies**

Run: `npm ls framer-motion react-hot-toast`
Expected: Both packages listed with versions.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion and react-hot-toast"
```

---

### Task 2: Create toast notification system

**Files:**
- Create: `src/components/Toaster.tsx`
- Modify: `src/App.tsx:1-25` (add import)
- Modify: `src/App.tsx:~440` (add Toaster component)

**Step 1: Create Toaster wrapper component**

```tsx
import { Toaster } from 'react-hot-toast';

export const AppToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.85rem',
        fontFamily: 'var(--font-sans)',
      },
      success: { iconTheme: { primary: '#22C55E', secondary: '#FFFFFF' } },
      error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
    }}
  />
);
```

**Step 2: Import and render AppToaster in App.tsx**

In `src/App.tsx`, add import:
```typescript
import { AppToaster } from './components/Toaster';
```

Render inside the app container (before closing `</div>`):
```tsx
<AppToaster />
```

**Step 3: Replace all `alert()` calls with toast throughout the app**

- `Settings.tsx:52-56`: Replace `alert('Datos importados...')` and `alert('Error...')` with `toast.success(...)` and `toast.error(...)`
- `PomodoroTimer.tsx:72,75`: Replace `alert('¡Tiempo completado!')` with `toast.success(...)`
- `Outreach.tsx:567`: Replace `confirm()` with a proper action (leave confirm for now, or use toast)

Add import: `import toast from 'react-hot-toast';`

**Step 4: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/Toaster.tsx src/App.tsx src/components/Settings.tsx src/components/PomodoroTimer.tsx src/components/Outreach.tsx
git commit -m "feat: add toast notification system"
```

---

### Task 3: Add page transition animations

**Files:**
- Modify: `src/App.tsx` (wrap route sections with motion.div)
- Modify: `src/App.tsx:474-601` (add AnimatePresence + motion.div)

**Step 1: Import framer-motion in App.tsx**

```typescript
import { AnimatePresence, motion } from 'framer-motion';
```

**Step 2: Wrap each tab content with motion.div inside AnimatePresence**

Replace the current tab rendering section:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentTab + (activeProjectId || '')}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
  >
    {currentTab === 'dashboard' && (...)}
    {currentTab === 'project' && activeProject && (...)}
    ...
  </motion.div>
</AnimatePresence>
```

Note: each tab's content must be directly inside the motion.div, not wrapped in individual fragments.

**Step 3: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add page transition animations"
```

---

### Task 4: Add hover/lift animations to cards and buttons

**Files:**
- Modify: `src/index.css` (add utility animation classes)
- Modify: `src/components/Dashboard.tsx` (wrap project cards with motion.div)
- Modify: `src/components/ProjectDetails.tsx` (wrap kanban tasks with motion.div)
- Modify: `src/components/Clients.tsx` (wrap client cards with motion.div)
- Modify: `src/components/Finances.tsx` (wrap finance cards with motion.div)

**Step 1: Add CSS animation utilities to index.css**

```css
/* ===== MICRO-INTERACTIONS ===== */
.hover-lift {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.hover-lift:active {
  transform: translateY(0);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 var(--accent-ring); }
  50% { box-shadow: 0 0 0 4px var(--accent-ring); }
}
.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Step 2: Add `hover-lift` class to key interactive elements**

- `.project-card` → add `hover-lift` class
- `.kanban-task` → add `hover-lift` class  
- `.stat-card` → on hover add subtle lift
- `.add-card` → on hover add lift

**Step 3: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/index.css src/components/Dashboard.tsx src/components/ProjectDetails.tsx src/components/Clients.tsx src/components/Finances.tsx
git commit -m "feat: add hover-lift micro-interactions to cards"
```

---

### Task 5: Implement functional search bar with Ctrl+K

**Files:**
- Modify: `src/components/Dashboard.tsx:94-106` (replace fake search bar)

**Step 1: Replace the fake "+" search bar with a real search input**

The current search bar in Dashboard is just `onClick={onAddProjectClick}` — it opens the new project modal instead of searching. Replace it with:

```tsx
<div className="search-bar" onClick={() => {
  const input = document.getElementById('gp-search-input');
  if (input) input.focus();
}}>
  <Search size={16} />
  <input
    id="gp-search-input"
    type="text"
    placeholder="Buscar proyectos..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    onFocus={(e) => e.currentTarget.parentElement?.classList.add('search-bar-focused')}
    onBlur={(e) => e.currentTarget.parentElement?.classList.remove('search-bar-focused')}
  />
  <span className="kbd">Ctrl+K</span>
</div>
```

**Step 2: Add searchQuery state and filter logic to Dashboard**

```typescript
const [searchQuery, setSearchQuery] = useState('');
```

Add keyboard listener for Ctrl+K:
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('gp-search-input')?.focus();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Step 3: Filter projects by search query**

```typescript
const filteredProjects = sortedProjects.filter(p =>
  !searchQuery.trim() ||
  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
  p.description.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: implement functional search bar with Ctrl+K"
```

---

### Task 6: Improve empty states throughout the app

**Files:**
- Modify: `src/components/Dashboard.tsx` (improve empty state)
- Modify: `src/components/ProjectDetails.tsx` (improve empty task state)
- Modify: `src/components/Clients.tsx` (improve empty client state)
- Modify: `src/components/Finances.tsx` (improve empty invoice state)
- Modify: `src/components/CalendarView.tsx` (improve empty calendar)
- Modify: `src/index.css` (add empty-state styles)

**Step 1: Add CSS for empty states**

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 3rem 2rem; text-align: center; gap: 1rem;
  border: 1px dashed var(--border); border-radius: var(--radius-lg);
  background: var(--bg-card); min-height: 240px;
}
.empty-state-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: var(--accent-bg); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
}
.empty-state-title {
  font-size: 1rem; font-weight: 600; color: var(--text-main);
}
.empty-state-desc {
  font-size: 0.82rem; color: var(--text-muted); max-width: 320px; line-height: 1.5;
}
```

**Step 2: Replace existing empty states**

Replace the `add-card` empty states (for "no items") with the new `.empty-state` component pattern.

Example for Dashboard (when no projects):
```tsx
<div className="empty-state">
  <div className="empty-state-icon">
    <FolderKanban size={24} />
  </div>
  <div className="empty-state-title">No hay proyectos todavia</div>
  <div className="empty-state-desc">Crea tu primer proyecto para empezar a organizar tu trabajo.</div>
  <button className="btn btn-primary" onClick={onAddProjectClick}>
    <Plus size={16} /> Crear Proyecto
  </button>
</div>
```

**Step 3: Commit**

```bash
git add src/index.css src/components/Dashboard.tsx src/components/ProjectDetails.tsx src/components/Clients.tsx src/components/Finances.tsx src/components/CalendarView.tsx
git commit -m "feat: improve empty states with illustrations and CTAs"
```

---

### Task 7: Fix mobile responsiveness issues

**Files:**
- Modify: `src/index.css` (mobile breakpoint improvements)
- Modify: `src/App.tsx` (fix mobile menu button rendering)
- Modify: `src/components/BottomNav.tsx` (improve nav items)

**Step 1: Only render mobile menu button on mobile**

In `App.tsx`, wrap the mobile menu button:
```tsx
<div className="mobile-menu-btn-wrapper">
  <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú">
    ...
  </button>
</div>
```

And in CSS, hide wrapper on desktop:
```css
.mobile-menu-btn-wrapper { display: none; }
@media (max-width: 768px) {
  .mobile-menu-btn-wrapper { display: block; }
}
```

**Step 2: Fix BottomNav active state for project tab**

Currently on mobile, `currentTab === 'project'` highlights the "Proyectos" button. Add a small dot indicator to show which project is active.

**Step 3: Fix stats row on very narrow screens (<480px)**

```css
@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr 1fr; gap: 6px; }
  .stat-card { padding: 12px 14px; }
  .stat-card-value { font-size: 1.3rem; }
}
```

**Step 4: Ensure PWA install button doesn't overlap bottom nav**

In `src/index.css`, adjust InstallButton position:
```css
@media (max-width: 768px) {
  .install-btn { bottom: 72px !important; }
}
```

**Step 5: Commit**

```bash
git add src/index.css src/App.tsx src/components/BottomNav.tsx
git commit -m "fix: mobile responsive improvements and nav consistency"
```

---

### Task 8: Add dark/light mode transition

**Files:**
- Modify: `src/index.css` (add transition on body)

**Step 1: Add global transition for theme change**

```css
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}
*, *::before, *::after {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease, box-shadow 0.2s ease;
}
```

Note: Add `transition: none !important` for elements that should not transition (like modals, spinners, etc.).

**Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add smooth dark/light mode transition"
```

---

### Task 9: Improve Pomodoro experience

**Files:**
- Modify: `src/components/PomodoroTimer.tsx`

**Step 1: Read the file first to understand current structure**

Run: `cat src/components/PomodoroTimer.tsx`

**Step 2: Replace `alert()` with subtle notification**

Replace the `alert()` on session complete with:
- A toast notification
- Brief browser notification via `Notification API` (if permitted)

```typescript
import toast from 'react-hot-toast';

// Inside the timer complete handler:
toast.success('¡Tiempo completado! Tómate un descanso.', {
  duration: 5000,
  icon: '⏰',
});
```

**Step 3: Add optional browser notification**

```typescript
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('Pomodoro completo', {
    body: 'Buen trabajo. Tómate un descanso.',
    icon: '/pwa-icon-192x192.png',
  });
}
```

Also add a "sounds" toggle in settings (optional — YAGNI for now if too complex).

**Step 4: Commit**

```bash
git add src/components/PomodoroTimer.tsx
git commit -m "feat: improve pomodoro completion feedback with toast + notification"
```

---

### Task 10: Fix common UX friction points

**Files:**
- Modify: `src/components/Modals.tsx` (add ESC to close, auto-focus improvements)
- Modify: `src/components/ProjectInfoPanel.tsx` (add edit indicators)
- Modify: `src/components/Finances.tsx` (replace inline delete confirm with dialog)

**Step 1: Add ESC key to close modals**

In `Modals.tsx`, add:
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  if (isOpen) window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [isOpen, onClose]);
```

**Step 2: Fix Finances delete confirmation**

Replace the inline "Si/No" buttons with a proper confirmation dialog using `confirm()` consistently, or a small inline confirm modal:

```typescript
const confirmDelete = (invId: string) => {
  if (confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) {
    onDeleteInvoice(invId);
  }
};
```

And simplify the component to just use `confirm()` like the rest of the app does.

**Step 3: Commit**

```bash
git add src/components/Modals.tsx src/components/Finances.tsx
git commit -m "fix: improve modal UX and standardize delete confirmations"
```

---

### Task 11: Add subtle skeleton loading states

**Files:**
- Create: `src/components/Skeletons.tsx`
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/Clients.tsx`

**Step 1: Create skeleton component**

```tsx
import React from 'react';

const SkeletonRow = ({ width = '100%', height = 16, style }: {
  width?: string | number; height?: number; style?: React.CSSProperties;
}) => (
  <div style={{
    width, height, borderRadius: '6px',
    background: 'linear-gradient(90deg, var(--bg-hover) 0%, var(--bg-active) 50%, var(--bg-hover) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
    ...style,
  }} />
);

export const ProjectCardSkeleton = () => (
  <div className="project-card" style={{ pointerEvents: 'none' }}>
    <SkeletonRow height={4} style={{ borderRadius: '2px' }} />
    <SkeletonRow width="70%" height={18} />
    <SkeletonRow width="40%" height={14} />
    <SkeletonRow width="60%" height={12} />
    <SkeletonRow height={4} style={{ borderRadius: '2px' }} />
  </div>
);
```

**Step 2: Add shimmer animation to index.css**

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Step 3: Use skeleton loading while data is loading**

In Dashboard, pass a `loading` prop. When true, show 3 `ProjectCardSkeleton` components in the grid instead of empty state.

Don't over-engineer: only add skeletons to the two primary views (Dashboard and Clients).

**Step 4: Commit**

```bash
git add src/components/Skeletons.tsx src/index.css src/components/Dashboard.tsx src/components/Clients.tsx
git commit -m "feat: add skeleton loading states for dashboard and clients"
```

---

### Task 12: Fix Outreach component styling consistency

**Files:**
- Modify: `src/components/Outreach.tsx` (migrate inline styles to CSS classes)

**Step 1: Extract Outreach-specific CSS to index.css**

```css
/* ===== OUTREACH ===== */
.outreach-header { ... }
.outreach-brand-tabs { ... }
.outreach-stats-row { ... }
.outreach-pipeline { ... }
.outreach-card { ... }
```

**Step 2: Replace inline styles with classNames**

Replace the largest inline style blocks in Outreach.tsx with CSS class references. Focus on the pipeline column cards and lead cards, as these are the most heavily inlined.

**Step 3: Commit**

```bash
git add src/index.css src/components/Outreach.tsx
git commit -m "refactor: migrate outreach inline styles to CSS classes"
```

---

### Task 13: Add subtle floating action button animation

**Files:**
- Modify: `src/index.css` (add FAB animation)

**Step 1: Add floating animation for mobile menu button**

```css
.mobile-menu-btn {
  animation: fab-enter 0.3s ease-out;
}
@keyframes fab-enter {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
/* Subtle pulse to draw attention to the FAB */
.mobile-menu-btn {
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3);
}
.mobile-menu-btn:hover {
  box-shadow: 0 6px 24px rgba(249, 115, 22, 0.45);
  transform: scale(1.05);
}
.mobile-menu-btn:active {
  transform: scale(0.95);
}
```

**Step 2: Add loading spin animation to buttons**

When a save is in progress, show a spinner. Add a `loading` state to primary buttons.

In `Modals.tsx`, add loading state:
```tsx
const [saving, setSaving] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim() || saving) return;
  setSaving(true);
  // ... existing save logic
  // After save completes:
  setSaving(false);
};
```

Add CSS:
```css
.btn-loading { pointer-events: none; opacity: 0.7; }
```

**Step 3: Commit**

```bash
git add src/index.css src/components/Modals.tsx
git commit -m "feat: add button loading states and FAB animation"
```

---

### Task 14: Add visual feedback for data sync

**Files:**
- Modify: `src/App.tsx` (improve connection indicator)

**Step 1: Improve the connection indicator**

The current connection indicator (`Conectado` / `Sin conexión`) is a small badge. Make it more useful:

- Clickable to trigger manual sync
- Show last sync time
- Animate on reconnect

In `App.tsx`:

```typescript
const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

// In refetchAll, after success:
setLastSyncTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
```

Replace the static connection badge:

```tsx
<button
  onClick={() => { if (!connectionOk) refetchAll(); }}
  title={connectionOk ? `Última sincronización: ${lastSyncTime || '—'}` : 'Sin conexión — haz clic para reconectar'}
  style={{
    // ... existing styles plus cursor pointer if disconnected
    cursor: connectionOk ? 'default' : 'pointer',
    animation: connectionOk ? 'none' : 'pulse-glow 2s ease-in-out infinite',
  }}
>
  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: connectionOk ? '#22c55e' : '#ef4444' }} />
  {connectionOk ? `Sincronizado ${lastSyncTime || ''}` : 'Sin conexión'}
</button>
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: improve sync status indicator with last sync time and manual reconnect"
```

---

### Task 15: Spanish spelling fixes

**Files:**
- Grep all files for misspellings

**Step 1: Find and fix common misspellings**

Run: `rg -n 'sesion|contrasena|Anadir|exito|valido|disenado|automaticamente|emision|Descripcion|Configuracion|Sincronizacion|Aplicacion' src/ --include '*.tsx' --include '*.ts' --include '*.css'`

Expected fixes:
- `sesion` → `sesión`
- `contrasena` → `contraseña`
- `Anadir` → `Añadir`
- `exito` → `éxito`
- `valido` → `válido`
- `disenado` → `diseñado`
- `automaticamente` → `automáticamente`
- `emision` → `emisión`
- `Descripcion` → `Descripción`
- `Configuracion` → `Configuración`
- `Sincronizacion` → `Sincronización`
- `Aplicacion` → `Aplicación`

Fix each in the appropriate component file.

**Step 2: Commit**

```bash
git add src/ -A
git commit -m "fix: correct Spanish spelling (accents, ñ)"
```

---

### Task 16: Verify everything builds

**Step 1: Full build test**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings.

**Step 2: Run lint**

Run: `npx eslint .`
Expected: No errors (or minimal pre-existing ones).

**Step 3: Run tests**

Run: `npm test`
Expected: All existing tests pass.

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore: final polish and build verification"
```
