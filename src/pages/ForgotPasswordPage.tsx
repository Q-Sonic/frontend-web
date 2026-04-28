import { useState } from 'react';
import { Button, Input } from '../components';
import { AuthLayout } from '../components/AuthLayout';
import { forgotPassword, resetPassword } from '../api';
import { Link } from 'react-router-dom';
import { config } from '../config';

/* ── Icons ── */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockOpenIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    <circle cx="12" cy="16" r="1" fill="currentColor" />
  </svg>
);

const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4.1a1 1 0 0 0-1.4 0l-2.1 2.1a1 1 0 0 0 0 1.4Z" />
    <path d="m15.5 7.5-3 3" />
    <path d="m10 13-4 4v2h2l1-1v-1l1-1h1l1-1" />
    <circle cx="7" cy="17" r="3" />
  </svg>
);

const ShieldLockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <rect x="9" y="11" width="6" height="5" rx="1" />
    <path d="M12 11V9a2 2 0 1 0-4 0v2" />
  </svg>
);

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request, 2: Reset Form, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    console.log('[ForgotPassword] handleRequestCode called', { email, loading });
    if (!email.trim() || loading) {
      console.log('[ForgotPassword] Validation failed or already loading');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('[ForgotPassword] triggering forgotPassword api call...', { 
        apiUrl: config.apiBaseUrl,
        fullPath: `${config.apiBaseUrl}/auth/forgot-password`
      });
      await forgotPassword(email.trim());
      console.log('[ForgotPassword] api call success');
      setStep(2);
    } catch (err: any) {
      console.error('[ForgotPassword] api call failed', err);
      setError(err.message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !newPassword.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword: newPassword.trim(),
      });
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Código inválido o error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout backLink={{ to: '/login', label: 'Volver atrás' }}>
      {/* Icon badge */}
      <div className="mb-8 flex flex-col items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#00d4c8]/10 border border-[#00d4c8]/20
                        flex items-center justify-center text-[#00d4c8]">
          <LockOpenIcon />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {step === 3 ? '¡Listo!' : '¿Olvidaste tu contraseña?'}
          </h2>
          <p className="mt-1.5 text-white/45 text-sm max-w-[320px] leading-relaxed">
            {step === 1 && 'Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.'}
            {step === 2 && `Ingresa el código que enviamos a ${email} y tu nueva contraseña.`}
            {step === 3 && 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleRequestCode} className="flex flex-col gap-5" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            icon={<MailIcon />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Enviar código de recuperación
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-5" noValidate>
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3 mb-2">
            <p className="text-emerald-400 text-[11px] leading-relaxed">
              <strong>¡Revisa tu correo!</strong> Se ha enviado un código de seguridad.
            </p>
          </div>
          <Input
            label="Código de recuperación"
            type="text"
            placeholder="123456"
            icon={<KeyIcon />}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            icon={<ShieldLockIcon />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            required
          />
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Restablecer contraseña
          </Button>
          <button
            type="button"
            className="text-xs text-[#00d4c8] hover:underline text-center"
            onClick={() => setStep(1)}
          >
            Usar otro correo
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <Link to="/login" className="w-full">
            <Button variant="primary" fullWidth>
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
