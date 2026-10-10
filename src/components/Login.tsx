import React, { useState } from 'react';

interface LoginProps {
  onSignIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  onReset: (email: string) => Promise<{ error: { message: string } | null }>;
}

export const Login: React.FC<LoginProps> = ({ onSignIn, onReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    const { error } = await onSignIn(email.trim(), password);
    setBusy(false);
    if (error) setError('Correo o contraseña incorrectos.');
  };

  const handleReset = async () => {
    if (!email.trim()) { setError('Escribe tu correo para recuperar la contraseña.'); return; }
    setError(''); setInfo('');
    const { error } = await onReset(email.trim());
    if (error) setError(error.message);
    else setInfo('Te enviamos un correo para restablecer la contraseña.');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--gp-bg)' }}>
      <div className="modal-content" style={{ maxWidth: '380px', width: '100%' }}>
        <div className="modal-header">
          <div className="sidebar-logo" style={{ fontSize: '1.1rem' }}>
            <div className="sidebar-logo-icon">B</div>
            <span>BlessProjects</span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Correo</label>
              <input type="email" className="form-control" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input type="password" className="form-control" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p style={{ color: 'var(--gp-red)', fontSize: '0.85rem' }}>{error}</p>}
            {info && <p style={{ color: 'var(--gp-green)', fontSize: '0.85rem' }}>{info}</p>}
          </div>
          <div className="modal-footer" style={{ flexDirection: 'column', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Entrando...' : 'Iniciar sesión'}
            </button>
            <button type="button" onClick={handleReset}
              style={{ background: 'none', border: 'none', color: 'var(--gp-text-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--gp-font-sans)' }}>
              Olvidaste tu contraseña?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
