import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import type { Project, Task, SubTask, TaskStatus, TaskPriority, ProjectStatus } from '../types';

const PALETTE_COLORS = [
  '#F97316',
  '#EA580C',
  '#3B82F6',
  '#22C55E',
  '#8B5CF6',
  '#06B6D4',
  '#EF4444',
  '#787886',
];

/* ==========================================
   PROJECT MODAL
   ========================================== */
interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: {
    name: string; description: string; color: string;
    client: string; status: ProjectStatus; startDate: string; dueDate: string;
  }) => void;
  project?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  project,
}) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PALETTE_COLORS[0]);
  const [client, setClient] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setColor(project.color);
      setClient(project.client);
      setStatus(project.status);
      setStartDate(project.startDate);
      setDueDate(project.dueDate);
    } else {
      setName('');
      setDescription('');
      setColor(PALETTE_COLORS[0]);
      setClient('');
      setStatus('active');
      setStartDate('');
      setDueDate('');
    }
    setSaving(false);
  }, [project, isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    onSave({ name, description, color, client, status, startDate, dueDate });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {project ? <><Edit size={18} /> Editar Proyecto</> : 'Crear Nuevo Proyecto'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-field">
              <label>Nombre del Proyecto</label>
              <input
                type="text"
                placeholder="Ej. Contenido FloxAI"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Descripción</label>
              <textarea
                rows={3}
                placeholder="De qué se trata este proyecto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label>Cliente</label>
              <input
                type="text"
                placeholder="Ej. Crumpizza, FloxAI…"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="modal-field">
                <label>Estado</label>
                <select value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                  <option value="active">Activo</option>
                  <option value="paused">En pausa</option>
                  <option value="done">Terminado</option>
                </select>
              </div>
              <div className="modal-field">
                <label>Inicio</label>
                <input type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="modal-field">
                <label>Entrega</label>
                <input type="date" value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="modal-field">
              <label>Color del Proyecto</label>
              <div className="color-selector">
                {PALETTE_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={`color-dot-btn ${color === hex ? 'active' : ''}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => setColor(hex)}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={`btn btn-primary${saving ? ' btn-loading' : ''}`} disabled={saving}>
              {project ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ==========================================
   TASK MODAL
   ========================================== */
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    tags: string[];
    subtasks: SubTask[];
  }) => void;
  onDelete?: (taskId: string) => void;
  task?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  task,
}) => {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate || '');
      setTagInput(task.tags.join(', '));
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
      setTagInput('');
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
    setSaving(false);
  }, [task, isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((sub) => (sub.id === id ? { ...sub, completed: !sub.completed } : sub))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((sub) => sub.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    onSave({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      subtasks,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {task ? 'Editar Tarea' : 'Crear Nueva Tarea'}
          </h3>
          <div className="gp-flex-center gp-gap-2">
            {task && onDelete && (
              <button
                type="button"
                className="btn-icon-only"
                style={{ borderColor: 'var(--gp-red)', color: 'var(--gp-red)' }}
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                title="Eliminar Tarea"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="modal-field">
              <label>Título de la Tarea</label>
              <input
                type="text"
                placeholder="Ej. Crear guion de reel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Descripción</label>
              <textarea
                rows={2}
                placeholder="Escribe detalles importantes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="modal-field">
                <label>Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="todo">Por Hacer</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="review">En Revisión</option>
                  <option value="done">Listo</option>
                </select>
              </div>

              <div className="modal-field">
                <label>Prioridad</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="modal-field">
                <label>Fecha Límite</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label>Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  placeholder="marketing, video, copy"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-field gp-mt-2">
                <label>Lista de verificación (Checklist)</label>

              <div className="checklist-builder gp-mb-2">
                {subtasks.map((sub) => (
                  <div key={sub.id} className="checklist-builder-item gp-flex-center" style={{ gap: '8px', padding: '4px 0' }}>
                    <input
                      type="checkbox"
                      className="subtask-checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '0.9rem',
                        textDecoration: sub.completed ? 'line-through' : 'none',
                        color: sub.completed ? 'var(--gp-text-tertiary)' : 'var(--gp-text-primary)',
                      }}
                    >
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--gp-text-tertiary)', cursor: 'pointer', display: 'flex' }}
                      onClick={() => handleDeleteSubtask(sub.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="gp-flex-center gp-gap-2">
                <input
                  type="text"
                  placeholder="Agregar elemento a la lista..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleAddSubtask}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={`btn btn-primary${saving ? ' btn-loading' : ''}`} disabled={saving}>
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
