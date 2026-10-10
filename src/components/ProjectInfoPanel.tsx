import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import type { Project, ProjectStatus, ProjectLink, ProjectObjective } from '../types';

interface Props {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Activo', paused: 'En pausa', done: 'Terminado',
};

export const ProjectInfoPanel: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [notes, setNotes] = useState(project.notes);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [objInput, setObjInput] = useState('');
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, []);

  useEffect(() => { setNotes(project.notes); }, [project.id]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      onUpdateProject({ ...project, notes: value });
    }, 600);
  };

  const setStatus = (status: ProjectStatus) => onUpdateProject({ ...project, status });
  const setStart = (startDate: string) => onUpdateProject({ ...project, startDate });
  const setDue = (dueDate: string) => onUpdateProject({ ...project, dueDate });

  const addLink = () => {
    if (!linkUrl.trim()) return;
    const link: ProjectLink = {
      id: crypto.randomUUID(),
      label: linkLabel.trim() || linkUrl.trim(),
      url: linkUrl.trim(),
    };
    onUpdateProject({ ...project, links: [...project.links, link] });
    setLinkLabel(''); setLinkUrl('');
  };

  const removeLink = (id: string) =>
    onUpdateProject({ ...project, links: project.links.filter((l) => l.id !== id) });

  const addObjective = () => {
    if (!objInput.trim()) return;
    const obj: ProjectObjective = { id: crypto.randomUUID(), text: objInput.trim(), done: false };
    onUpdateProject({ ...project, objectives: [...project.objectives, obj] });
    setObjInput('');
  };
  const toggleObjective = (id: string) =>
    onUpdateProject({
      ...project,
      objectives: project.objectives.map((o) => (o.id === id ? { ...o, done: !o.done } : o)),
    });
  const removeObjective = (id: string) =>
    onUpdateProject({ ...project, objectives: project.objectives.filter((o) => o.id !== id) });

  const objDone = project.objectives.filter((o) => o.done).length;
  const objPct = project.objectives.length
    ? Math.round((objDone / project.objectives.length) * 100)
    : 0;

  return (
    <section className="settings-section gp-mb-6">
      <div className="form-row">
        {project.client && (
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <div className="gp-text-base" style={{ fontWeight: 600 }}>{project.client}</div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Estado</label>
          <div className="gp-flex gp-gap-2">
            {(['active', 'paused', 'done'] as ProjectStatus[]).map((s) => (
              <button key={s} type="button"
                className={`project-card-status ${s}`}
                style={{
                  cursor: 'pointer', border: 'none',
                  opacity: s === project.status ? 1 : 0.5,
                }}
                onClick={() => setStatus(s)}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Inicio</label>
          <input type="date" className="form-control" value={project.startDate}
            onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Entrega</label>
          <input type="date" className="form-control" value={project.dueDate}
            onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Objetivos del proyecto</label>
        {project.objectives.length > 0 && (
          <div className="gp-mb-2">
            <div className="task-progress task-progress-sm gp-mb-2">
              <div className="task-progress-fill task-progress-fill-gradient" style={{ width: `${objPct}%` }} />
            </div>
            <ul className="checklist-list">
              {project.objectives.map((o) => (
                <li key={o.id} className="checklist-row">
                  <button type="button" onClick={() => toggleObjective(o.id)}
                    className="gp-btn-icon">
                    {o.done
                      ? <CheckCircle2 size={16} className="gp-text-green" />
                      : <Circle size={16} className="gp-text-tertiary" />
                    }
                  </button>
                  <span className={`${o.done ? 'checklist-done' : ''} gp-flex-1`}>{o.text}</span>
                  <button type="button" onClick={() => removeObjective(o.id)} className="gp-btn-icon">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="gp-text-secondary gp-text-xs gp-mt-1" style={{ fontWeight: 600 }}>
              {objDone}/{project.objectives.length} completados ({objPct}%)
            </div>
          </div>
        )}
        <div className="gp-flex-center gp-gap-2">
          <input type="text" className="form-control gp-flex-1"
            placeholder="Nuevo objetivo / meta..." value={objInput}
            onChange={(e) => setObjInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addObjective(); } }} />
          <button type="button" className="btn btn-ghost" onClick={addObjective}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notas / Brief</label>
        <textarea className="form-control" rows={5}
          placeholder="Objetivos, contexto, decisiones del proyecto..."
          value={notes} onChange={(e) => handleNotesChange(e.target.value)} />
      </div>

      <div className="form-group gp-mb-0">
        <label className="form-label">Links / Recursos</label>
        {project.links.length > 0 && (
          <div className="gp-flex-col gp-gap-2 gp-mb-2">
            {project.links.map((l) => (
              <div key={l.id} className="link-card">
                <a href={l.url} target="_blank" rel="noreferrer"
                  className="gp-flex-center gp-gap-1 gp-text-accent gp-flex-1 gp-text-sm">
                  <ExternalLink size={14} /> {l.label}
                </a>
                <button type="button" onClick={() => removeLink(l.id)} className="gp-btn-icon">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="gp-flex-center gp-flex-wrap gp-gap-2">
          <input type="text" className="form-control" style={{ flex: 1, minWidth: '120px' }}
            placeholder="Etiqueta (ej. Figma)" value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)} />
          <input type="url" className="form-control" style={{ flex: 2, minWidth: '160px' }}
            placeholder="https://..." value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
          <button type="button" className="btn btn-ghost" onClick={addLink}>
            <Plus size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
