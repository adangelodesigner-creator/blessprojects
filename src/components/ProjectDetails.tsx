import React, { useState } from 'react';
import {
  KanbanSquare,
  List,
  Plus,
  Edit,
  Trash2,
  Calendar,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { Project, Task, TaskStatus, TaskPriority, Profile } from '../types';
import { ProjectInfoPanel } from './ProjectInfoPanel';
import { ProjectFiles } from './ProjectFiles';
import { TaskDetailPanel } from './TaskDetailPanel';
import { ShareProjectModal, getInitials, getAvatarColor } from './ShareProjectModal';

interface ProjectDetailsProps {
  project: Project;
  tasks: Task[];
  onAddRuleClick: () => void;
  onEditProject: () => void;
  onDeleteProject: () => void;
  onUpdateProject: (updated: Project) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTask: (updated: Task) => void;
  onDeleteTask: (taskId: string) => void;
  profiles: Profile[];
  currentUserId: string;
  isAdmin: boolean;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  tasks,
  onAddRuleClick,
  onEditProject,
  onDeleteProject,
  onUpdateProject,
  onUpdateTaskStatus,
  onToggleSubtask,
  onUpdateTask,
  onDeleteTask,
  profiles,
  currentUserId,
  isAdmin,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'tareas' | 'info' | 'archivos'>('tareas');

  const projectTasks = tasks.filter((t) => t.projectId === project.id);

  const filteredTasks = projectTasks.filter((task) => {
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

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

const isOverdue = (dueDateStr: string, status: TaskStatus) => {
    if (!dueDateStr || status === 'done') return false;
    return new Date(dueDateStr + 'T23:59:59') < new Date();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'Por Hacer' },
    { id: 'in_progress', title: 'En Progreso' },
    { id: 'review', title: 'En Revisión' },
    { id: 'done', title: 'Listo' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData('text/plain', taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onUpdateTaskStatus(taskId, status);
  };

  const cycleStatus = (task: Task, direction: 'forward' | 'backward') => {
    const statuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
    const idx = statuses.indexOf(task.status);
    const next = direction === 'forward' ? idx + 1 : idx - 1;
    if (next >= 0 && next < statuses.length) onUpdateTaskStatus(task.id, statuses[next]);
  };

  const renderChecklist = (task: Task) => {
    if (task.subtasks.length === 0) return null;
    const done = task.subtasks.filter((s) => s.completed).length;
    const pct = Math.round((done / task.subtasks.length) * 100);
    return (
      <div className="task-checklist" onClick={(e) => e.stopPropagation()}>
        <div className="task-checklist-head">
          <CheckSquare size={13} style={{ color: 'var(--gp-accent)' }} />
          <span className="task-checklist-count">{done}/{task.subtasks.length}</span>
          <div className="task-progress"><div className="task-progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
        <ul className="checklist-list">
          {task.subtasks.map((s) => (
            <li key={s.id} className="checklist-row">
              <input type="checkbox" className="subtask-checkbox" checked={s.completed}
                onChange={() => onToggleSubtask(task.id, s.id)} />
              <span className={s.completed ? 'checklist-done' : ''}>{s.title}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const detailTask = tasks.find((t) => t.id === detailTaskId) || null;

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: project.color, flexShrink: 0 }} />
            <h1>{project.name}</h1>
            {(isAdmin || project.userId === currentUserId) && (
              <div className="shared-avatars" onClick={() => setShareModalOpen(true)} style={{ cursor: 'pointer' }}>
                {(project.sharedWith || []).slice(0, 4).map((pid) => {
                  const p = profiles.find(pr => pr.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="avatar-sm" style={{ background: getAvatarColor(pid) }}
                      title={p.displayName}>
                      {getInitials(p.displayName)}
                    </div>
                  );
                })}
                <div className="avatar-add" title="Compartir proyecto">
                  <Plus size={12} />
                </div>
              </div>
            )}
          </div>
          <p>{project.description || 'Sin descripción.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={onEditProject} title="Editar Proyecto">
            <Edit size={16} /><span className="desktop-only">Editar</span>
          </button>
          <button className="btn btn-ghost" style={{ color: 'var(--gp-red)' }}
            onClick={() => { if (confirm(`¿Eliminar el proyecto "${project.name}" y todas sus tareas?`)) onDeleteProject(); }}
            title="Eliminar Proyecto">
            <Trash2 size={16} /><span className="desktop-only">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '1.5rem',
        borderBottom: '1px solid var(--gp-border)', paddingBottom: '0',
      }}>
        {([
          { id: 'tareas', label: 'Tareas' },
          { id: 'info', label: 'Info' },
          { id: 'archivos', label: 'Archivos' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            style={{
              padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: activeSection === id ? 'var(--gp-accent)' : 'var(--gp-text-secondary)',
              borderBottom: activeSection === id ? '2px solid var(--gp-accent)' : '2px solid transparent',
              borderRadius: '0', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeSection === 'info' && (
        <ProjectInfoPanel project={project} onUpdateProject={onUpdateProject} />
      )}

      {activeSection === 'archivos' && (
        <ProjectFiles projectId={project.id} />
      )}

      {activeSection === 'tareas' && (
      <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '600px' }}>
          <input type="text" className="form-control" placeholder="Buscar por título, etiquetas..."
            style={{ flex: 2, minWidth: '180px' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <select className="form-control" style={{ flex: 1, minWidth: '120px' }}
            value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">Prioridad: Todas</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="view-toggle-container" style={{ margin: 0 }}>
            <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Vista de Lista">
              <List size={16} /><span>Lista</span>
            </button>
            <button className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')} title="Vista de Tablero">
              <KanbanSquare size={16} /><span>Tablero</span>
            </button>
          </div>
          <button className="btn btn-primary" onClick={onAddRuleClick}>
            <Plus size={16} /><span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="cu-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '1rem' }}>
              <div className="empty-state-icon">
                <KanbanSquare size={24} />
              </div>
              <div className="empty-state-title">No hay tareas en este proyecto</div>
              <div className="empty-state-desc">Crea una tarea para empezar a organizar el trabajo.</div>
              <button className="btn btn-primary" onClick={onAddRuleClick}>
                <Plus size={16} /> Nueva Tarea
              </button>
            </div>
          ) : (
            columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              if (colTasks.length === 0) return null;
              return (
                <React.Fragment key={col.id}>
                  <div className="list-group-header">
                    <span>{col.title}</span>
                    <span className="gp-ml-auto kanban-column-count">{colTasks.length}</span>
                  </div>
                  {colTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const done = task.subtasks.filter((s) => s.completed).length;
                    return (
                      <div key={task.id} className="list-row">
                        <input type="checkbox" className="cu-done" title="Marcar como listo"
                          checked={task.status === 'done'}
                          style={{ accentColor: 'var(--gp-accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                          onChange={() => onUpdateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' })} />

                        <button className="gp-flex-1 gp-text-left" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', font: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: '150px' }}
                          onClick={() => setDetailTaskId(task.id)}>
                          <span className={task.status === 'done' ? 'checklist-done' : ''}>{task.title}</span>
                          {task.subtasks.length > 0 && (
                            <span className="gp-text-tertiary" style={{ fontSize: '0.7rem', fontWeight: 500 }}>✓ {done}/{task.subtasks.length}</span>
                          )}
                          {task.tags.map((t) => <span key={t} className="tag-badge" style={{ fontSize: '0.65rem' }}>#{t}</span>)}
                        </button>

                        <select className={`status-pill ${task.status}`} value={task.status}
                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)} title="Estado">
                          {columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>

                        <select className={`cu-pill cu-priority priority-${task.priority}`} value={task.priority}
                          onChange={(e) => onUpdateTask({ ...task, priority: e.target.value as TaskPriority })} title="Prioridad">
                          <option value="low">Baja</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                        </select>

                        <input type="date" className={`cu-date ${overdue ? 'overdue' : ''}`} value={task.dueDate}
                          onChange={(e) => onUpdateTask({ ...task, dueDate: e.target.value })} title="Fecha límite" style={{ maxWidth: '140px' }} />
                        {(task.dueDate && task.status !== 'done') && (
                          <a href={gcalUrl(task)} target="_blank" rel="noreferrer" className="cu-pill" style={{ textDecoration: 'none', padding: '3px 6px', lineHeight: 1 }} title="Añadir a Google Calendar">
                            <Calendar size={13} style={{ display: 'block' }} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })
          )}
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="kanban-container">
          {columns.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="kanban-column"
                onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                <div className="kanban-column-header">
                  <span>{col.title}</span>
                  <span className="kanban-column-count">{columnTasks.length}</span>
                </div>
                <div className="kanban-column-body">
                  {columnTasks.length === 0 ? (
                    <div className="gp-p-6 gp-text-tertiary gp-text-sm" style={{ textAlign: 'center', border: '1px dashed var(--gp-border)', borderRadius: 'var(--gp-radius-md)' }}>
                      Arrastra tareas aquí
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const overdue = isOverdue(task.dueDate, task.status);
                      return (
                        <div key={task.id} className="kanban-card" draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => setDetailTaskId(task.id)}>
                          <div className="kanban-card-priority"
                            style={{ background: task.priority === 'high' ? 'var(--gp-red)' : task.priority === 'medium' ? 'var(--gp-yellow)' : 'var(--gp-text-tertiary)' }} />
                          <div className="kanban-card-title">{task.title}</div>
                          {task.description && <div className="kanban-task-desc">{task.description}</div>}
                          {renderChecklist(task)}
                          <div className="kanban-task-tags">
                            <span className={`priority-badge priority-${task.priority}`}>
                              {task.priority === 'low' ? 'Baja' : task.priority === 'medium' ? 'Media' : 'Alta'}
                            </span>
                            {task.tags.map((tag) => <span key={tag} className="tag-badge" style={{ background: 'var(--gp-surface-hover)', color: 'var(--gp-text-secondary)', fontSize: '0.65rem', fontWeight: 500, padding: '2px 7px', borderRadius: '4px' }}>#{tag}</span>)}
                          </div>
                          <div className="kanban-card-footer" onClick={(e) => e.stopPropagation()}>
                            <div className={`task-date ${overdue ? 'overdue' : ''}`}>
                              {task.dueDate && (<><Calendar size={12} /><span>{formatDate(task.dueDate)} {overdue && '(Vencida)'}</span></>)}
                              {task.dueDate && task.status !== 'done' && (
                                <a href={gcalUrl(task)} target="_blank" rel="noreferrer" className="gp-text-accent" style={{ display: 'inline-flex', marginLeft: '4px' }} title="Añadir a Google Calendar">
                                  <Calendar size={12} />
                                </a>
                              )}
                            </div>
                            <div className="gp-flex-center gp-gap-1">
                              {task.status !== 'todo' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => cycleStatus(task, 'backward')} title="Retroceder estado"><ChevronLeft size={12} /></button>
                              )}
                              {task.status !== 'done' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => cycleStatus(task, 'forward')} title="Avanzar estado"><ChevronRight size={12} /></button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {detailTask && (
        <TaskDetailPanel
          task={detailTask}
          onClose={() => setDetailTaskId(null)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={(id) => { onDeleteTask(id); setDetailTaskId(null); }}
        />
      )}

      <ShareProjectModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        project={project}
        profiles={profiles}
        ownerId={project.userId}
        onUpdateProject={onUpdateProject}
      />
    </div>
  );
};
