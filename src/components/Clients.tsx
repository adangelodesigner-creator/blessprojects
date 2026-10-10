import { useState, useMemo } from 'react';
import { Users, FolderKanban, Search, ChevronRight } from 'lucide-react';
import type { Project, Task } from '../types';

interface ClientsProps {
  projects: Project[];
  tasks: Task[];
  onProjectSelect: (projectId: string) => void;
  onAddProjectClick: () => void;
}

export const Clients: React.FC<ClientsProps> = ({
  projects,
  tasks,
  onProjectSelect,
  onAddProjectClick,
}) => {
  const [search, setSearch] = useState('');

  const clients = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of projects) {
      const name = p.client || 'Sin cliente';
      const list = map.get(name) ?? [];
      list.push(p);
      map.set(name, list);
    }
    return Array.from(map.entries())
      .map(([name, projs]) => ({
        name,
        projects: projs,
        taskCount: projs.reduce((a, p) => a + tasks.filter((t) => t.projectId === p.id).length, 0),
        doneCount: projs.reduce((a, p) => a + tasks.filter((t) => t.projectId === p.id && t.status === 'done').length, 0),
      }))
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [projects, tasks, search]);

  const totalClients = clients.filter((c) => c.name !== 'Sin cliente').length;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="gp-flex-between gp-mb-6" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="title-large">Clientes</div>
          <div className="subtitle">{totalClients} clientes, {projects.length} proyectos</div>
        </div>
        <button className="btn btn-primary" onClick={onAddProjectClick}>
          <FolderKanban size={16} />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      <div className="search-bar gp-mb-6">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={24} />
          </div>
          <div className="empty-state-title">{search ? 'Sin resultados' : 'No hay clientes todavia'}</div>
          <div className="empty-state-desc">
            {search ? `No se encontraron clientes para "${search}"` : 'Asigna un cliente a tus proyectos para verlos aqui.'}
          </div>
          {!search && (
            <button className="btn btn-primary" onClick={onAddProjectClick}>
              <FolderKanban size={16} /> Nuevo Proyecto
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {clients.map((client) => (
            <div key={client.name} className="project-card hover-lift" style={{ cursor: 'default' }}>
              <div className="project-card-accent" style={{ backgroundColor: 'var(--gp-accent)' }} />
              <div className="project-card-header">
                <div>
                  <div className="project-card-name">{client.name}</div>
                  <span className="project-card-status"
                    style={{ color: 'var(--gp-blue)', background: 'var(--gp-blue-bg)' }}>
                    {client.projects.length} {client.projects.length === 1 ? 'proyecto' : 'proyectos'}
                  </span>
                </div>
              </div>
              <div className="project-card-footer gp-gap-2">
                <div className="gp-flex-center gp-text-secondary gp-gap-4" style={{ fontSize: '0.8rem' }}>
                  <span><FolderKanban size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{client.doneCount}/{client.taskCount} tareas</span>
                </div>
                <div className="gp-flex-center gp-flex-wrap gp-mt-2" style={{ gap: '6px' }}>
                  {client.projects.map((p) => (
                    <button
                      key={p.id}
                      className="btn btn-ghost btn-sm"
                      onClick={() => onProjectSelect(p.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                    >
                      <span className="dot" style={{ backgroundColor: p.color, display: 'inline-block' }} />
                      {p.name}
                      <ChevronRight size={12} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className="add-card hover-lift" onClick={onAddProjectClick}>
            <FolderKanban size={20} />
            <span>Nuevo Proyecto</span>
          </div>
        </div>
      )}
    </div>
  );
};
