import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, SubTask } from '../types';

interface Props {
  task: Task;
  onClose: () => void;
  onUpdateTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
}

const STATUS_OPTS: { v: TaskStatus; label: string }[] = [
  { v: 'todo', label: 'Por Hacer' },
  { v: 'in_progress', label: 'En Progreso' },
  { v: 'review', label: 'En Revisión' },
  { v: 'done', label: 'Listo' },
];
const PRIORITY_OPTS: { v: TaskPriority; label: string }[] = [
  { v: 'low', label: 'Baja' },
  { v: 'medium', label: 'Media' },
  { v: 'high', label: 'Alta' },
];

const gcalUrl = (t: { title: string; description?: string; dueDate?: string }) => {
  if (!t.dueDate) return '';
  const s = t.dueDate.replace(/-/g, '');
  const d = new Date(t.dueDate + 'T23:59:59');
  d.setDate(d.getDate() + 1);
  const e = d.toISOString().split('T')[0].replace(/-/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: t.title,
    dates: `${s}/${e}`, details: t.description || '',
    ctz: 'America/Caracas',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};

export const TaskDetailPanel: React.FC<Props> = ({ task, onClose, onUpdateTask, onDeleteTask }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [tagText, setTagText] = useState(task.tags.join(', '));
  const [newSub, setNewSub] = useState('');
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (titleTimer.current) clearTimeout(titleTimer.current);
      if (descTimer.current) clearTimeout(descTimer.current);
    };
  }, []);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setTagText(task.tags.join(', '));
  }, [task.id]);

  const patch = (p: Partial<Task>) => onUpdateTask({ ...task, ...p });

  const onTitle = (v: string) => {
    setTitle(v);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => patch({ title: v.trim() || 'Sin título' }), 500);
  };
  const onDesc = (v: string) => {
    setDescription(v);
    if (descTimer.current) clearTimeout(descTimer.current);
    descTimer.current = setTimeout(() => patch({ description: v }), 500);
  };
  const commitTags = () => {
    patch({ tags: tagText.split(',').map((t) => t.trim()).filter(Boolean) });
  };

  const addSub = () => {
    if (!newSub.trim()) return;
    const sub: SubTask = { id: crypto.randomUUID(), title: newSub.trim(), completed: false };
    patch({ subtasks: [...task.subtasks, sub] });
    setNewSub('');
  };
  const toggleSub = (id: string) =>
    patch({ subtasks: task.subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)) });
  const removeSub = (id: string) =>
    patch({ subtasks: task.subtasks.filter((s) => s.id !== id) });

  const done = task.subtasks.filter((s) => s.completed).length;
  const pct = task.subtasks.length ? Math.round((done / task.subtasks.length) * 100) : 0;
  const cal = gcalUrl(task);

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <aside className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-panel-head">
          <span className="detail-panel-title-label">Tarea</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-icon-only" title="Eliminar tarea"
              style={{ borderColor: 'var(--gp-red)', color: 'var(--gp-red)' }}
              onClick={() => { if (confirm('¿Eliminar esta tarea?')) { onDeleteTask(task.id); onClose(); } }}>
              <Trash2 size={16} />
            </button>
            <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="detail-panel-body">
          <input className="detail-title-input" value={title}
            onChange={(e) => onTitle(e.target.value)} placeholder="Título de la tarea" />

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-control" value={task.status}
                onChange={(e) => patch({ status: e.target.value as TaskStatus })}>
                {STATUS_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select className="form-control" value={task.priority}
                onChange={(e) => patch({ priority: e.target.value as TaskPriority })}>
                {PRIORITY_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fecha limite</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input type="date" className="form-control" value={task.dueDate}
                  onChange={(e) => patch({ dueDate: e.target.value })} style={{ flex: 1 }} />
                {cal && (
                  <a href={cal} target="_blank" rel="noreferrer" className="btn-icon-only" title="Anadir a Google Calendar">
                    <Calendar size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-control" rows={4} value={description}
              onChange={(e) => onDesc(e.target.value)} placeholder="Detalles, contexto, links..." />
          </div>

          <div className="form-group">
            <label className="form-label">
              Checklist{task.subtasks.length > 0 ? ` · ${done}/${task.subtasks.length} (${pct}%)` : ''}
            </label>
            {task.subtasks.length > 0 && (
              <div className="task-progress" style={{ marginBottom: '0.6rem', height: '8px' }}>
                <div className="task-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            )}
            <ul className="checklist-list" style={{ maxHeight: 'none' }}>
              {task.subtasks.map((s) => (
                <li key={s.id} className="checklist-row">
                  <input type="checkbox" className="subtask-checkbox" checked={s.completed}
                    onChange={() => toggleSub(s.id)} />
                  <span className={s.completed ? 'checklist-done' : ''} style={{ flex: 1 }}>{s.title}</span>
                  <button type="button" onClick={() => removeSub(s.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--gp-text-tertiary)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input className="form-control" style={{ flex: 1 }} placeholder="Agregar item al checklist..."
                value={newSub} onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }} />
              <button type="button" className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }} onClick={addSub}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Etiquetas (separadas por coma)</label>
            <input className="form-control" value={tagText}
              onChange={(e) => setTagText(e.target.value)} onBlur={commitTags}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitTags(); } }}
              placeholder="marketing, video, copy" />
          </div>
        </div>
      </aside>
    </>
  );
};
