import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Download, Loader2, File, FolderOpen, Image, FileText, Video, Music, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ProjectFile } from '../types';
import * as db from '../services/db';

interface Props { projectId: string; }

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.startsWith('text/')) return FileText;
  return File;
}

export const ProjectFiles: React.FC<Props> = ({ projectId }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [confirmDelete, setConfirmDelete] = useState<ProjectFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try { setFiles(await db.listProjectFiles(projectId)); }
    catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!busy) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) await uploadFiles(droppedFiles);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    await uploadFiles(selected);
    if (inputRef.current) inputRef.current.value = '';
  };

  const uploadFiles = async (fileList: File[]) => {
    const oversized = fileList.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      toast.error(
        `${oversized.length > 1 ? 'Archivos' : 'Archivo'} excede${oversized.length === 1 ? '' : 'n'} 50MB: ${oversized.map((f) => f.name).join(', ')}`
      );
      return;
    }

    setBusy(true);
    setUploadProgress({});

    for (const file of fileList) {
      try {
        await db.uploadProjectFile(projectId, file, (pct) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: pct }));
        });
        toast.success(`"${file.name}" subido`);
      } catch (err) {
        console.error(err);
        toast.error(`Error subiendo "${file.name}"`);
      }
    }

    setUploadProgress({});
    setBusy(false);
    await load();
  };

  const handleDownload = async (f: ProjectFile) => {
    try { window.open(await db.getFileDownloadUrl(f), '_blank'); }
    catch (e) { console.error(e); toast.error('No se pudo generar el enlace.'); }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await db.deleteProjectFile(confirmDelete);
      toast.success(`"${confirmDelete.fileName}" eliminado`);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      console.error(e);
      toast.error('No se pudo eliminar.');
    }
  };

  const fmtSize = (b: number) =>
    b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

  return (
    <section className="settings-section gp-mb-6">
      <div className="gp-flex-between gp-mb-3">
        <h3 className="settings-title gp-mb-0">Archivos</h3>
      </div>

      <div
        className={`file-drop-zone${busy ? ' busy' : ''}${dragActive ? ' active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !busy && inputRef.current?.click()}
      >
        {busy ? <Loader2 size={28} className="spin" /> : <Upload size={28} />}
        <span>{busy ? 'Subiendo…' : 'Haz clic o arrastra archivos aquí'}</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleInputChange}
          disabled={busy}
        />
      </div>

      {busy && Object.keys(uploadProgress).length > 0 && (
        <div className="gp-flex-col gp-gap-2 gp-mt-3">
          {Object.entries(uploadProgress).map(([name, pct]) => (
            <div key={name} className="gp-flex-col gp-gap-1" style={{ padding: 'var(--gp-space-2) 0' }}>
              <div className="gp-flex-between">
                <span className="gp-text-sm gp-truncate" style={{ flex: 1 }}>{name}</span>
                <span className="gp-text-xs gp-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
              </div>
              <div className="file-progress-bar">
                <div className="file-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 ? (
        <div className="gp-flex-col gp-flex-center" style={{ gap: 'var(--gp-space-2)', padding: 'var(--gp-space-5) 0', textAlign: 'center' }}>
          <FolderOpen size={32} className="gp-text-tertiary" />
          <p className="gp-text-sm gp-text-tertiary">Sin archivos adjuntos.</p>
        </div>
      ) : (
        <div className="gp-flex-col gp-gap-2 gp-mt-3">
          {files.map((f) => {
            const Icon = getFileIcon(f.mimeType);
            return (
              <div key={f.id} className="file-row">
                <div className="file-row-icon">
                  <Icon />
                </div>
                <span className="file-row-name">{f.fileName}</span>
                <span className="gp-text-xs gp-text-secondary" style={{ whiteSpace: 'nowrap' }}>{fmtSize(f.sizeBytes)}</span>
                <button type="button" onClick={() => handleDownload(f)} title="Descargar"
                  className="gp-btn-icon" style={{ color: 'var(--gp-accent)' }}>
                  <Download size={15} />
                </button>
                <button type="button" onClick={() => setConfirmDelete(f)} title="Eliminar"
                  className="gp-btn-icon">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3 className="modal-title">Eliminar archivo</h3>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--gp-text-sm)', color: 'var(--gp-text-secondary)', lineHeight: 1.5 }}>
                ¿Estás seguro de que quieres eliminar <strong style={{ color: 'var(--gp-text-primary)' }}>"{confirmDelete.fileName}"</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: 'var(--gp-red)', color: 'white', borderColor: 'var(--gp-red)' }}
                onClick={handleDeleteConfirm}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
