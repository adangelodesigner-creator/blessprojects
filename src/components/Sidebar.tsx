import React from 'react';
import { LayoutDashboard, Settings, Plus, Calendar, Sun, Moon, ChevronLeft, Users, DollarSign, Shield } from 'lucide-react';
import type { Project } from '../types';

export type NavTab = 'dashboard' | 'calendar' | 'settings' | 'project' | 'clients' | 'finances' | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  activeProjectId: string | null;
  projects: Project[];
  setTab: (tab: NavTab) => void;
  setActiveProjectId: (id: string | null) => void;
  onAddProjectClick: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeProjectId,
  projects,
  setTab,
  setActiveProjectId,
  onAddProjectClick,
  theme,
  onToggleTheme,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  isAdmin,
}) => {
  type NavItem = { id: NavTab; label: string; Icon: React.ComponentType<{ size?: number }> };
  const nav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'finances' as NavTab, label: 'Facturas', Icon: DollarSign },
    { id: 'clients' as NavTab, label: 'Clientes', Icon: Users },
    { id: 'calendar' as NavTab, label: 'Calendario', Icon: Calendar },
    ...(isAdmin ? [{ id: 'admin' as NavTab, label: 'Admin', Icon: Shield }] : []),
  ];

  const handleNav = (tab: NavTab) => {
    setTab(tab);
    setActiveProjectId(null);
    onCloseMobile();
  };

  return (
    <>
      <nav className="rail" aria-label="Navegación rápida">
        <div className="rail-logo">B</div>
        {nav.map(({ id, label, Icon }) => (
          <button
            key={`rail-${id}`}
            className={`rail-btn ${currentTab === id ? 'active' : ''}`}
            onClick={() => handleNav(id)}
            title={label}
            aria-label={label}
          >
            <Icon size={18} />
          </button>
        ))}
        {isAdmin && (
          <button
            className={`rail-btn ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNav('settings')}
            title="Ajustes"
            aria-label="Ajustes"
          >
            <Settings size={18} />
          </button>
        )}
        <div className="rail-spacer" />
        <button
          className="rail-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          aria-label={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>
      <div className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} onClick={onCloseMobile} />
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">B</div>
            <span>BlessProjects</span>
          </div>
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expandir' : 'Colapsar'}>
            <ChevronLeft size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`sidebar-nav-item ${currentTab === id ? 'active' : ''}`}
              onClick={() => handleNav(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
          <div className="sidebar-nav-divider" />
          {isAdmin && (
            <button
              className={`sidebar-nav-item ${currentTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleNav('settings')}
            >
              <Settings size={18} />
              <span>Ajustes</span>
            </button>
          )}
        </nav>

        <div className="sidebar-section-label gp-flex-between">
          <span>Proyectos</span>
          <div className="gp-flex-center" style={{ gap: 6 }}>
            {projects.length > 0 && (
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--gp-text-tertiary)', background: 'var(--gp-surface-hover)', padding: '0 6px', borderRadius: '999px', lineHeight: '16px' }}>{projects.length}</span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onAddProjectClick(); }}
              style={{ background: 'none', border: 'none', color: 'var(--gp-accent)', cursor: 'pointer', display: 'flex', padding: 0 }}
              title="Crear Proyecto"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="sidebar-project-list">
          {projects.length === 0 ? (
            <div style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--gp-text-tertiary)', textAlign: 'center' }}>
              Sin proyectos
            </div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                className={`sidebar-project-item ${currentTab === 'project' && activeProjectId === project.id ? 'active' : ''}`}
                onClick={() => { setActiveProjectId(project.id); setTab('project'); onCloseMobile(); }}
              >
                <div className="sidebar-project-dot" style={{ backgroundColor: project.color }} />
                <span>{project.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
