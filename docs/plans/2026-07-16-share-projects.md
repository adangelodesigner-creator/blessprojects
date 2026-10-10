# Share Projects — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cualquier usuario (admin/brother) puede compartir sus proyectos con otros miembros via un modal desde la vista del proyecto.

**Architecture:** Se agrega `userId` a la interfaz Project para identificar al dueño. Nuevo componente `ShareProjectModal` reutilizable. Botón "Compartir" en ProjectDetails que abre el modal. RLS ya implementado.

**Tech Stack:** React 19, TypeScript 6, Supabase, Tailwind

---

### Task 1: Agregar `userId` a Project type

**Files:**
- Modify: `src/types.ts:55-69`
- Modify: `src/lib/mappers.ts`

**Step 1: Add `userId` field**

En `src/types.ts`, agregar `userId: string;` al interface `Project` (después de `sharedWith`).

**Step 2: Update mappers**

En `src/lib/mappers.ts`:
- `rowToProject`: agregar `userId: row.user_id`
- `projectToRow`: agregar `user_id: p.userId`

**Step 3: Build check**

Run: `npm run build`
Expected: PASS

---

### Task 2: Crear ShareProjectModal

**Files:**
- Create: `src/components/ShareProjectModal.tsx`

**Step 1: Create component**

```tsx
import React from 'react';
import { Share2, X } from 'lucide-react';
import type { Project, Profile } from '../types';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  profiles: Profile[];
  ownerId: string;
  onUpdateProject: (p: Project) => void;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen, onClose, project, profiles, ownerId, onUpdateProject,
}) => {
  const others = profiles.filter((p) => p.id !== ownerId);
  const shared = project.sharedWith || [];

  const toggle = (profileId: string) => {
    const next = shared.includes(profileId)
      ? shared.filter((id) => id !== profileId)
      : [...shared, profileId];
    onUpdateProject({ ...project, sharedWith: next });
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <div className="modal-title">Compartir proyecto</div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            {project.name}
          </p>
          {others.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>No hay otros usuarios en el sistema.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {others.map((profile) => (
                <label key={profile.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  cursor: 'pointer', borderBottom: '1px solid var(--border)',
                }}>
                  <input
                    type="checkbox"
                    checked={shared.includes(profile.id)}
                    onChange={() => toggle(profile.id)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                  />
                  <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{profile.displayName}</div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{profile.email}</div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Build check**

Run: `npm run build`
Expected: PASS

---

### Task 3: Agregar botón Compartir en ProjectDetails

**Files:**
- Modify: `src/components/ProjectDetails.tsx`
- Modify: `src/App.tsx`

**Step 1: Add props y modal en ProjectDetails**

Agregar imports:
```tsx
import { Share2 } from 'lucide-react';
import { ShareProjectModal } from './ShareProjectModal';
import type { Profile } from '../types';
```

Agregar props:
```tsx
profiles: Profile[];
currentUserId: string;
```

Agregar state:
```tsx
const [shareModalOpen, setShareModalOpen] = useState(false);
```

En el header (en la sección de botones junto a Editar/Eliminar), agregar:
```tsx
<button className="btn btn-ghost btn-sm" onClick={() => setShareModalOpen(true)}
  title="Compartir proyecto">
  <Share2 size={14} /> Compartir
</button>
```

Renderizar modal al final del JSX (antes del cierre del fragmento principal):
```tsx
<ShareProjectModal
  isOpen={shareModalOpen}
  onClose={() => setShareModalOpen(false)}
  project={project}
  profiles={profiles}
  ownerId={project.userId}
  onUpdateProject={onUpdateProject}
/>
```

**Step 2: Pasar props desde App.tsx**

En `App.tsx`, pasar a `<ProjectDetails>`:
```tsx
profiles={profiles}
currentUserId={user?.id ?? ''}
```

**Step 3: Visibilidad condicional del botón**

Envolver botón en:
```tsx
{(isAdmin || project.userId === currentUserId) && (
  <button ...>Compartir</button>
)}
```

**Step 4: Build check**

Run: `npm run build`
Expected: PASS

---

### Task 4: Verificar y desplegar

**Step 1: Build final**

Run: `npm run build`
Expected: PASS sin errores

**Step 2: Deploy**

Run: `npx vercel --prod --yes`
Expected: deployment URL + status ok

**Step 3: Verify RLS (ya hecho)**

Las 8 policies de `rls_shared_child_data` ya se aplicaron en sesión anterior:
- tasks (shared tasks read, shared tasks write)
- pomodoro_sessions (shared sessions read, shared sessions write)
- invoices (shared invoices read, shared invoices write)
- financial_entries (shared financial_entries read, shared financial_entries write)

