import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components';
import { AuthLayout } from '../components/AuthLayout';
import * as authService from '../api/authService';

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
    <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4.3a1 1 0 0 0-1.4 0l-2.1 2.1a1 1 0 0 0 0 1.4Z" />
    <path d="m15.5 7.5-3 3" />
    <path d="M11 12.5 8 15.5l-2-2-3 3v2h2l3-3 2 2 3-3" />
  </svg>
);

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Error al enviar el código de recuperación');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !newPassword.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(email, code, newPassword);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout backLink={{ to: '/login', label: 'Volver al inicio de sesión' }}>
      {/* Icon badge */}
      <div className="mb-8 flex flex-col items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#00d4c8]/10 border border-[#00d4c8]/20
                        flex items-center justify-center text-[#00d4c8]">
          <LockOpenIcon />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {step === 'success' ? '¡Todo listo!' : '¿Olvidaste tu contraseña?'}
          </h2>
          <p className="mt-1.5 text-white/45 text-sm max-w-[320px] leading-relaxed">
            {step === 'request' && 'Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.'}
            {step === 'reset' && 'Hemos enviado un código a tu correo. Ingrésalo junto con tu nueva contraseña.'}
            {step === 'success' && 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 'request' && (
        <form onSubmit={handleRequestCode} className="flex flex-col gap-5" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            icon={<MailIcon />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar código de recuperación'}
          </Button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-5" noValidate>
          <Input
            label="Código de verificación"
            type="text"
            placeholder="Ingresa el código de 6 dígitos"
            icon={<KeyIcon />}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Nueva contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Button type="submit" variant="primary" fullWidth disabled={loading}>
            {loading ? 'Restableciendo...' : 'Cambiar contraseña'}
          </Button>

          <button
            type="button"
            onClick={() => setStep('request')}
            className="text-white/40 text-xs hover:text-white transition-colors"
          >
            ¿No recibiste el código? Intentar de nuevo
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="flex flex-col gap-6">
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-5 py-5">
            <div className="flex items-start gap-3">
              <svg className="text-emerald-400 mt-0.5 flex-shrink-0" width="18" height="18"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p className="text-emerald-400 text-sm font-semibold">
                Contraseña actualizada correctamente
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={() => navigate('/login')}
          >
            Ir al inicio de sesión
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
