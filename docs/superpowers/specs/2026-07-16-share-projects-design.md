# Share Projects — Design Spec

**Date:** 2026-07-16
**Status:** Approved

## Overview

Cualquier usuario (admin o brother) puede compartir sus propios proyectos con cualquier otro miembro del sistema via un modal desde la vista del proyecto. Los miembros con acceso shared pueden leer tasks, sessions, invoices y files del proyecto (RLS ya implementado).

## Sections

### A — ShareProjectModal (nuevo componente)

**Props:**
```tsx
interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  profiles: Profile[];      // todos los usuarios del sistema
  ownerId: string;           // user.id del dueño del proyecto
  onUpdateProject: (p: Project) => void;
}
```

**Comportamiento:**
- Muestra lista de todos los profiles excepto el `ownerId`
- Cada profile tiene un checkbox que refleja si su UUID está en `project.sharedWith`
- Al hacer clic en "Guardar", llama `onUpdateProject` con el array `sharedWith` actualizado
- El modal se cierra al guardar o cancelar
- Sin estilos inline — usa clases CSS existentes (`.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`)

**Ubicación:** `src/components/ShareProjectModal.tsx`

### B — Botón en ProjectDetails

**Header del proyecto** — agrega botón "Compartir" junto a Editar y Eliminar, usando icono `Share2` de lucide-react. Solo visible si `isAdmin || project owner`.

**Nuevos props en ProjectDetails:**
```tsx
profiles: Profile[];
currentUserId: string;
```

**Data flow:** App.tsx ya tiene `profiles` y `user.id` → pasa a ProjectDetails → ProjectDetails abre ShareProjectModal.

**Condición de visibilidad del botón:**
- Admin: siempre ve el botón en todos los proyectos
- Brother: solo ve el botón en sus propios proyectos (`project.userId === currentUserId`)
- (Nota: el campo `userId` no existe actualmente en `Project` porque la RLS usa `user_id` de la DB, pero el frontend no lo mapea. Necesitamos agregarlo a la interfaz `Project`.)

### C — user_id en Project (frontend)

**Agregar `userId` a la interfaz `Project`** en `types.ts`:
```tsx
export interface Project {
  // ...existing fields
  userId: string;  // <-- nuevo, mapeado de user_id en DB
}
```

**Actualizar mappers** en `src/lib/mappers.ts`:
- `rowToProject`: mapear `user_id` → `userId`
- `projectToRow`: mapear `userId` → `user_id`

Esto permite saber si el usuario actual es el dueño del proyecto.

### D — AdminPanel (sin cambios)

La pestaña "Compartir Proyectos" en Admin se mantiene. Es una vista general útil para Angelo. Dado que ahora todos pueden compartir sus proyectos, el AdminPanel ya no es el único punto de entrada.

### E — RLS (ya implementado en migración previa)

Las 8 policies de `rls_shared_child_data` ya están aplicadas. Tasks, sessions, invoices, financial_entries tienen políticas SELECT que permiten shared access + INSERT limitado al owner.

## Files affected

| File | Change |
|------|--------|
| `src/types.ts` | Agregar `userId: string` a `Project` |
| `src/lib/mappers.ts` | Mapear user_id ↔ userId |
| `src/components/ShareProjectModal.tsx` | **Nuevo** — modal de checkboxes |
| `src/components/ProjectDetails.tsx` | Agregar botón Compartir + props |
| `src/components/ProjectDetails.tsx` | Header — botón Share2 que abre modal |
| `src/App.tsx` | Pasar `profiles` y `currentUserId` a ProjectDetails |

## Edge cases

- **Brother sin proyectos propios:** no ve el botón (condition check on userId)
- **Admin viendo proyecto de brother:** ve el botón (isAdmin check)
- **sharedWith vacío:** modal muestra todos los checkboxes sin marcar
- **Perfil eliminado:** el UUID huérfano queda en sharedWith, no causa error (simplemente no se muestra en la lista)
