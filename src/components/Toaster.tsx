import { Toaster } from 'react-hot-toast';

export const AppToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: 'var(--gp-surface)',
        color: 'var(--gp-text-primary)',
        border: '1px solid var(--gp-border)',
        borderRadius: 'var(--gp-radius-md)',
        fontSize: '0.85rem',
        fontFamily: 'var(--gp-font-sans)',
      },
      success: { iconTheme: { primary: '#22C55E', secondary: '#FFFFFF' } },
      error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
    }}
  />
);
