import { useState, useEffect } from 'react';
import { FolderKanban, CheckSquare, Plus, TrendingUp, Search, AlertTriangle } from 'lucide-react';
import type { Project, Task, Profile } from '../types';
import { ShareProjectModal, getInitials, getAvatarColor } from './ShareProjectModal';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  onProjectSelect: (projectId: string) => void;
  onAddProjectClick: () => void;
  profiles?: Profile[];
  currentUserId?: string;
  onUpdateProject?: (p: Project) => void;
  isAdmin?: boolean;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - diff);
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { mon, sun };
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  tasks,
  onProjectSelect,
  onAddProjectClick,
  profiles,
  currentUserId,
  onUpdateProject,
}) => {
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const { mon, sun } = getWeekRange();
  const weekTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate + 'T00:00:00');
    return d >= mon && d <= sun;
  });
  const weekDone = weekTasks.filter((t) => t.status === 'done').length;
  const weekTotal = weekTasks.length;
  const overdue = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    return new Date(t.dueDate + 'T23:59:59') < new Date();
  });
  const weekLabel = mon.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    + ' - ' + sun.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const STATUS_META: Record<string, { label: string }> = {
    active: { label: 'Activo' },
    paused: { label: 'En pausa' },
    done:   { label: 'Terminado' },
  };
  const statusRank: Record<string, number> = { active: 0, paused: 1, done: 2 };
  const sortedProjects = [...projects].sort((a, b) => statusRank[a.status] - statusRank[b.status]);

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t) => t.status === 'done').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const getProjectTaskCounts = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const completed = projectTasks.filter((t) => t.status === 'done').length;
    return { total: projectTasks.length, completed };
  };

  const mailtoSummary = () => {
    const subj = encodeURIComponent(`Resumen Semanal - ${weekLabel}`);
    const body = encodeURIComponent(
      `Resumen Semanal (${weekLabel})\n\n` +
      `Tareas completadas: ${weekDone}/${weekTotal}\n` +
      `Tareas vencidas: ${overdue.length}\n` +
      `Proyectos activos: ${activeProjects}\n` +
      `Productividad general: ${taskCompletionRate}%\n\n` +
      `-- Enviado desde BlessProjects`
    );
    window.open(`mailto:?subject=${subj}&body=${body}`, '_blank');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [shareTarget, setShareTarget] = useState<Project | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('gp-search-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredProjects = sortedProjects.filter((p) =>
    !searchQuery.trim() ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Mis Proyectos</h1>
          <p>Lleva el control de tus proyectos y facturación.</p>
        </div>
        <div className="search-bar">
          <Search size={16} />
          <input
            id="gp-search-input"
            type="text"
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="kbd">Ctrl+K</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon gp-stat-icon-accent">
              <FolderKanban size={18} />
            </div>
          </div>
          <div className="stat-card-value">{totalProjects}</div>
          <div className="stat-card-label">Proyectos</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon gp-stat-icon-green">
              <CheckSquare size={18} />
            </div>
          </div>
          <div className="stat-card-value">{taskCompletionRate}%</div>
          <div className="stat-card-label">Tareas Listas ({completedTasks}/{totalTasks})</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon gp-stat-icon-accent">
              <FolderKanban size={18} />
            </div>
          </div>
          <div className="stat-card-value">{activeProjects}</div>
          <div className="stat-card-label">Activos</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon gp-stat-icon-yellow">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-card-value" style={{ color: overdue.length > 0 ? 'var(--gp-red)' : 'var(--gp-green)' }}>
            {overdue.length}
          </div>
          <div className="stat-card-label">Vencidas</div>
        </div>
      </div>

      <div className="section-header gp-mt-2">
        <h2 className="gp-flex-center gp-gap-1"><TrendingUp size={16} />Resumen Semanal</h2>
        <button className="btn btn-ghost btn-sm" onClick={mailtoSummary}>
          Enviar por correo
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">{weekLabel}</div>
          <div className="stat-card-value">{weekDone}/{weekTotal}</div>
          <div className="stat-card-label">Tareas completadas esta semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Vencidas</div>
          <div className="stat-card-value" style={{ color: overdue.length > 0 ? 'var(--gp-red)' : 'var(--gp-green)' }}>
            {overdue.length}
          </div>
          <div className="stat-card-label">Tareas fuera de fecha</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Proyectos activos</div>
          <div className="stat-card-value">{activeProjects}</div>
          <div className="stat-card-label">En curso</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Productividad</div>
          <div className="stat-card-value">{taskCompletionRate}%</div>
          <div className="stat-card-label">General</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Todos los Proyectos</h2>
        <button className="btn btn-primary" onClick={onAddProjectClick}>
          <Plus size={16} />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderKanban size={24} />
          </div>
          <div className="empty-state-title">No hay proyectos todavía</div>
          <div className="empty-state-desc">Crea tu primer proyecto para empezar a organizar tu trabajo.</div>
          <button className="btn btn-primary" onClick={onAddProjectClick}>
            <Plus size={16} /> Crear Proyecto
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search size={24} />
          </div>
          <div className="empty-state-title">Sin resultados</div>
          <div className="empty-state-desc">No se encontraron proyectos para "{searchQuery}"</div>
          <button className="btn btn-ghost" onClick={() => setSearchQuery('')}>
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const progress = getProjectProgress(project.id);
            const { total, completed } = getProjectTaskCounts(project.id);
            return (
              <div key={project.id} className="project-card" onClick={() => onProjectSelect(project.id)}>
                <div className="project-card-accent" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}dd)` }} />
                <div className="project-card-body">
                  <div className="gp-flex-between gp-mb-3">
                    <div>
                      <div className="project-card-name">{project.name}</div>
                      <div className="project-card-client">{project.client}</div>
                    </div>
                    <div className="shared-avatars" onClick={(e) => e.stopPropagation()}>
                      {(project.sharedWith || []).slice(0, 3).map((pid) => {
                        const p = profiles?.find(pr => pr.id === pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="avatar-sm" style={{ background: getAvatarColor(pid) }}
                            title={p.displayName} onClick={() => setShareTarget(project)}>
                            {getInitials(p.displayName)}
                          </div>
                        );
                      })}
                      <div className="avatar-add" onClick={() => setShareTarget(project)} title="Compartir proyecto">
                        <Plus size={12} />
                      </div>
                    </div>
                  </div>
                  <span className={`project-card-status ${project.status}`}>
                    {STATUS_META[project.status].label}
                  </span>
                  <div className="project-card-desc gp-mt-2">{project.description || 'Sin descripción.'}</div>
                  <div className="project-card-footer gp-mt-3">
                    <div className="project-card-progress">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                      </div>
                      <span>{progress}%</span>
                    </div>
                    <div className="gp-flex-between" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
                      <span className="gp-text-tertiary">{completed} de {total} tareas</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="add-card hover-lift" onClick={onAddProjectClick}>
            <Plus size={20} />
            <span>Añadir Proyecto</span>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <AnalyticsDashboard
          projects={projects}
          tasks={tasks}
        />
      )}

      {shareTarget && profiles && currentUserId && onUpdateProject && (
        <ShareProjectModal
          isOpen={true}
          onClose={() => setShareTarget(null)}
          project={shareTarget}
          profiles={profiles}
          ownerId={currentUserId}
          onUpdateProject={onUpdateProject}
        />
      )}
    </>
  );
};
