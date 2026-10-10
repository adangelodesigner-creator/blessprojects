import React from 'react';
import { X, Search, Check } from 'lucide-react';
import type { Project, Profile } from '../types';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  profiles: Profile[];
  ownerId: string;
  onUpdateProject: (p: Project) => void;
}

const AVATAR_COLORS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6','#06b6d4','#f97316','#84cc16'];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getAvatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen, onClose, project, profiles, ownerId, onUpdateProject,
}) => {
  const [search, setSearch] = React.useState('');
  const others = profiles.filter((p) => p.id !== ownerId);
  const shared = project.sharedWith || [];
  const filtered = search.trim()
    ? others.filter(p => p.displayName.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
    : others;

  const toggle = (profileId: string) => {
    const next = shared.includes(profileId)
      ? shared.filter((id) => id !== profileId)
      : [...shared, profileId];
    onUpdateProject({ ...project, sharedWith: next });
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div className="modal-title">Compartir proyecto</div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ paddingTop: 0 }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--gp-text-secondary)', marginBottom: 12 }}>
            {project.name}
          </p>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gp-text-secondary)', pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Buscar persona..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
                border: '1px solid var(--gp-border)', background: 'var(--bg-inset)',
                color: 'var(--text)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {filtered.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--gp-text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
              {search ? 'Sin resultados' : 'No hay otros usuarios en el sistema.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map((profile) => {
                const isShared = shared.includes(profile.id);
                return (
                  <div key={profile.id} className={`share-user-card${isShared ? ' shared' : ''}`}
                    onClick={() => toggle(profile.id)}>
                    <div className="avatar-lg" style={{ background: getAvatarColor(profile.id) }}>
                      {getInitials(profile.displayName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {profile.displayName}
                        {isShared && <Check size={12} style={{ color: 'var(--gp-accent)' }} />}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gp-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</div>
                    </div>
                    {isShared && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gp-accent)', flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Listo</button>
        </div>
      </div>
    </div>
  );
};

export { getInitials, getAvatarColor };
