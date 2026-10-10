import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari standalone flag (no estándar)
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

/**
 * Botón flotante "Instalar app" — SIEMPRE visible mientras la app no esté instalada.
 * - Si el navegador ofreció el diálogo nativo (beforeinstallprompt) → lo lanza.
 * - Si no (iPhone, o evento no disparado) → muestra instrucciones según plataforma.
 * - Se oculta solo cuando la app ya corre instalada (display-mode standalone).
 */
export const InstallButton: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      else setDeferred(null);
      return;
    }
    if (isIos()) {
      alert('Instalar en iPhone:\n1) Toca Compartir (el cuadro con la flecha ↑).\n2) Elige "Agregar a inicio".');
    } else {
      alert(
        'Instalar la app:\n\n' +
        '• Android (Chrome): menú ⋮ (arriba derecha) → "Instalar app" / "Agregar a pantalla de inicio".\n' +
        '• PC (Chrome/Edge): icono de instalar (⊕ o monitor) en la barra de direcciones, o menú → "Instalar".\n\n' +
        'Si no aparece la opción, puede que ya esté instalada.',
      );
    }
  };

  return (
    <button
      className="btn btn-primary"
      onClick={handleClick}
      title="Instalar app"
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '5rem',
        zIndex: 1000,
        borderRadius: '999px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
        gap: '0.5rem',
      }}
    >
      <Download size={18} />
      <span>Instalar app</span>
    </button>
  );
};
