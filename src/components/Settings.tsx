import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, Smartphone } from 'lucide-react';
import type { Settings as SettingsType } from '../types';

interface SettingsProps {
  settings: SettingsType;
  onUpdateSettings: (newSettings: SettingsType) => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => boolean;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  gcalConnected: boolean;
  onGCalConnect: () => void;
  onGCalDisconnect: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onExportData,
  onImportData,
  onSignOut,
  theme,
  onToggleTheme,
  gcalConnected,
  onGCalConnect,
  onGCalDisconnect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        try {
          const success = onImportData(result);
          if (success) {
            toast.success('Datos importados correctamente. Actualizando...');
            window.location.reload();
          } else {
            toast.error('Error al importar. El archivo no tiene un formato válido.');
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Error al importar datos.');
        }
      }
    };
    reader.readAsText(file);
  };

  const lastBackup = localStorage.getItem('lastBackupDate');
  const lastBackupDisplay = lastBackup
    ? new Date(lastBackup).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="settings-wrapper">
      <h1 className="title-large">Ajustes del Sistema</h1>
      <p className="subtitle">Configura tus preferencias y gestiona la copia de seguridad.</p>

      <div className="settings-container">
        {/* Appearance Settings */}
        <section className="settings-section">
          <h3 className="settings-title">Apariencia</h3>
          <p className="settings-desc">Alterna entre el modo claro y modo oscuro para la interfaz.</p>

          <div className="settings-row">
            <div>
              <strong className="settings-strong gp-mb-1">Modo Oscuro</strong>
              <span className="gp-text-sm gp-text-secondary">Activa una visualización con tonos oscuros y suaves.</span>
            </div>
            <div className="gp-flex-end">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onToggleTheme}
                style={{ minWidth: '130px' }}
              >
                {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              </button>
            </div>
          </div>
        </section>

        {/* Google Calendar Section */}
        <section className="settings-section">
          <h3 className="settings-title">Google Calendar (API directa)</h3>
          <p className="settings-desc">
            Conecta tu Google Calendar por API. Al crear o editar una tarea con fecha, se genera automáticamente un evento en tu calendario. No necesitas URLs públicas.
          </p>

          <div className="gp-flex-center gp-flex-wrap gp-gap-4">
            <div className="settings-dot-indicator" style={{
              background: gcalConnected ? 'var(--gp-green)' : 'var(--gp-text-tertiary)',
            }} />
            <span className="settings-gcal-status gp-font-medium">
              {gcalConnected ? 'Conectado a Google Calendar' : 'No conectado'}
            </span>
            {gcalConnected ? (
              <button className="btn btn-ghost" onClick={onGCalDisconnect}>
                Desconectar
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onGCalConnect}>
                Conectar Google Calendar
              </button>
            )}
          </div>

          <div className="gp-text-secondary gp-mt-3 settings-gcal-hint">
            {gcalConnected
              ? 'Las tareas con fecha se sincronizan automáticamente con tu calendario. Los eventos se crean como eventos de dia completo.'
              : 'Al conectar, se te pedirá autorizar el acceso a "calendar.events" para crear y gestionar eventos desde tus tareas.'}
          </div>
        </section>

        {/* Sync & Backup Section */}
        <section className="settings-section">
          <h3 className="settings-title">Copia de Seguridad y Sincronización</h3>
          <p className="settings-desc">
            Tus datos se guardan en la nube y se sincronizan entre tus dispositivos.
            Puedes exportar un respaldo JSON o importar datos desde otro lugar.
          </p>

          <div className="sync-buttons-group">
            <button className="btn btn-primary" onClick={onExportData}>
              <Download size={18} />
              <span>Exportar Datos (JSON)</span>
            </button>

            <label className="file-input-label">
              <Upload size={18} />
              <span>Importar Datos (JSON)</span>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileImport}
              />
            </label>
          </div>

          {lastBackupDisplay && (
            <div className="gp-mt-3 gp-text-secondary" style={{ fontSize: '0.78rem' }}>
              Última exportación: {lastBackupDisplay}
            </div>
          )}
        </section>

        {/* APK Compilation Instructions */}
        <section className="settings-section">
          <h3 className="settings-title">
            <Smartphone size={20} className="gp-text-accent" />
            <span>Generar APK para Teléfono (Capacitor)</span>
          </h3>
          <p className="settings-desc">
            Este software esta diseñado como una PWA. Puedes instalarlo directamente desde el navegador del movil (agregar a pantalla de inicio), o empaquetarlo como una APK de Android nativa con los siguientes comandos:
          </p>

          <div className="settings-code-block">
            <div># 1. Instala Capacitor en el proyecto</div>
            <div className="settings-code-line">npm install @capacitor/core @capacitor/cli</div>
            <div className="settings-code-line">npx cap init BlessProjects com.blessprojects.app --web-dir=dist</div>
            <br />
            <div># 2. Instala la plataforma de Android</div>
            <div className="settings-code-line">npm install @capacitor/android</div>
            <div className="settings-code-line">npx cap add android</div>
            <br />
            <div># 3. Construye la web y sincronizala con Android</div>
            <div className="settings-code-line">npm run build</div>
            <div className="settings-code-line">npx cap sync</div>
            <br />
            <div># 4. Abre Android Studio para generar tu APK firmada</div>
            <div className="settings-code-line">npx cap open android</div>
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-title">Cuenta</h3>
          <p className="settings-desc">Cierra sesión en este dispositivo.</p>
          <button className="btn btn-ghost" onClick={onSignOut}>Cerrar sesión</button>
        </section>
      </div>
    </div>
  );
};
