import React, { useState, useEffect } from 'react';
import { Shield, Users, FolderOpen, Check, Pencil, X, Save } from 'lucide-react';
import type { Profile, Project } from '../types';
import * as db from '../services/db';

interface AdminPanelProps {
  projects: Project[];
  onUpdateProject: (p: Project) => void;
  currentUserId: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  projects,
  onUpdateProject,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    db.fetchProfiles().then((p) => { setProfiles(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSaveName = async (profileId: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    try {
      await db.updateProfileName(profileId, trimmed);
      setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, displayName: trimmed } : p));
    } catch (e) { console.error(e); }
    setEditingName(null);
  };

  const handleShareProject = async (projectId: string, userId: string, share: boolean) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const current = project.sharedWith || [];
    const updated = share
      ? [...current, userId]
      : current.filter((id) => id !== userId);
    const changed = { ...project, sharedWith: updated };
    onUpdateProject(changed);
  };



  if (loading) {
    return <div className="page"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-row">
          <Shield size={22} />
          <h2>Panel de Control</h2>
        </div>
      </div>

      <div className="gp-flex-center gp-mb-6" style={{ gap: 8 }}>
        {[
          { id: 'users', label: 'Usuarios', Icon: Users },
          { id: 'projects', label: 'Compartir Proyectos', Icon: FolderOpen },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`admin-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id as typeof activeTab)}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid var(--gp-border)',
              background: activeTab === id ? 'var(--gp-accent)' : 'var(--gp-surface)',
              color: activeTab === id ? '#fff' : 'var(--text)',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="admin-section">
          <h3 className="gp-text-tertiary gp-mb-4" style={{ fontSize: '1rem' }}>
            <Users size={16} className="gp-mr-1" />
            Usuarios del sistema
          </h3>
          <div className="admin-users-grid" style={{ display: 'grid', gap: 12 }}>
            {profiles.map((profile) => (
              <div key={profile.id} className="admin-user-card gp-surface gp-border-line" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar-circle" style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: profile.role === 'admin' ? 'var(--gp-accent)' : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                  }}>
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {editingName === profile.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveName(profile.id)}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid var(--gp-accent)',
                            background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem',
                            width: 140, outline: 'none',
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleSaveName(profile.id)} style={{ background: 'none', border: 'none', color: 'var(--gp-accent)', cursor: 'pointer', padding: 2 }} title="Guardar"><Save size={16} /></button>
                        <button onClick={() => setEditingName(null)} style={{ background: 'none', border: 'none', color: 'var(--gp-text-tertiary)', cursor: 'pointer', padding: 2 }} title="Cancelar"><X size={16} /></button>
                      </div>
                    ) : (
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{profile.displayName}</div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--gp-text-tertiary)' }}>{profile.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge" style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                    background: profile.role === 'admin' ? 'rgba(0,229,255,0.12)' : 'rgba(107,114,128,0.12)',
                    color: profile.role === 'admin' ? 'var(--gp-accent)' : '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {profile.role === 'admin' ? 'Admin' : 'Brother'}
                  </span>
                  {editingName !== profile.id && (
                    <button onClick={() => { setEditingName(profile.id); setEditValue(profile.displayName); }} style={{ background: 'none', border: 'none', color: 'var(--gp-text-tertiary)', cursor: 'pointer', padding: 4 }} title="Editar nombre">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--gp-text-tertiary)' }}>
            Los usuarios se crean automáticamente al registrarse. Solo Angelo (admin) ve este panel.
          </p>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="admin-section">
          <h3 className="gp-text-tertiary gp-mb-4" style={{ fontSize: '1rem' }}>
            <FolderOpen size={16} className="gp-mr-1" />
            Compartir proyectos con usuarios
          </h3>
          <p className="gp-text-tertiary gp-mb-4" style={{ fontSize: '0.8rem' }}>
            Selecciona un proyecto y marca a qué usuarios darles acceso (lectura de recursos/archivos)
          </p>

          <div style={{ display: 'grid', gap: 12 }}>
            {projects.map((project) => {
              const brotherProfiles = profiles.filter((p) => p.role === 'brother');
              return (
                <details key={project.id} className="gp-surface gp-border-line" style={{
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  <summary className="gp-flex-center" style={{
                    padding: '12px 16px', cursor: 'pointer', fontWeight: 600,
                    fontSize: '0.9rem', gap: 8,
                  }}>
                    <div className="dot" style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: project.color, flexShrink: 0,
                    }} />
                    {project.name}
                    {(project.sharedWith?.length ?? 0) > 0 && (
                      <span className="badge gp-ml-auto" style={{
                        fontSize: '0.7rem', padding: '2px 8px',
                        borderRadius: 20, background: 'rgba(0,229,255,0.12)',
                        color: 'var(--gp-accent)', fontWeight: 600,
                      }}>
                        Compartido con {project.sharedWith.length}
                      </span>
                    )}
                  </summary>
                  <div style={{ padding: '8px 16px 16px', borderTop: '1px solid var(--gp-border)' }}>
                    {brotherProfiles.map((brother) => {
                      const shared = project.sharedWith?.includes(brother.id) ?? false;
                      return (
                        <label key={brother.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 0', cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={shared}
                            onChange={(e) => handleShareProject(project.id, brother.id, e.target.checked)}
                            style={{ width: 16, height: 16, accentColor: 'var(--gp-accent)' }}
                          />
                          <span style={{ fontSize: '0.85rem' }}>{brother.displayName}</span>
                          {shared && <Check size={14} style={{ color: 'var(--gp-accent)' }} />}
                        </label>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .admin-tab.active { border-color: var(--gp-accent); }
        .admin-section { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};