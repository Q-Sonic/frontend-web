import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input } from '../components';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { login, loginWithGoogleBackend } from '../api/authService';
import { writeAuthStorage } from '../helpers/authStorage';
import { normalizeRole } from '../helpers/role';
import { loginErrorMessage } from '../helpers/authErrors';
import { SESSION_KEY_POST_REGISTER_LOGIN } from '../constants/sessionStorageKeys';
import { signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../config/firebase';

/* ── Icons ── */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('rememberedEmail') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('shouldRememberMe') === 'true';
    } catch {
      return false;
    }
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const locationState = location.state as {
    from?: { pathname: string };
    registerSuccess?: boolean;
    passwordChangedRelogin?: boolean;
  } | undefined;
  // Use '/dashboard' as default redirected from main branch logic
  const from = locationState?.from?.pathname ?? '/dashboard';
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY_POST_REGISTER_LOGIN) === '1') return true;
    } catch {
      /* ignore */
    }
    return locationState?.registerSuccess === true;
  });
  const [showPasswordRelogin, setShowPasswordRelogin] = useState(
    () => locationState?.passwordChangedRelogin === true
  );

  function clearRegisterSuccess() {
    try {
      sessionStorage.removeItem(SESSION_KEY_POST_REGISTER_LOGIN);
    } catch {
      /* ignore */
    }
    setShowRegisterSuccess(false);
  }

  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(SESSION_KEY_POST_REGISTER_LOGIN);
      } catch {
        /* ignore */
      }
    };
  }, []);

  function clearPasswordRelogin() {
    setShowPasswordRelogin(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearRegisterSuccess();
    clearPasswordRelogin();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await login({ email, password });
      const { idToken, refreshToken, uid, role } = res.data;
      writeAuthStorage(
        {
          idToken,
          refreshToken,
          uid,
          role: normalizeRole(role),
        },
        rememberMe
      );

      try {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('shouldRememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.setItem('shouldRememberMe', 'false');
        }
      } catch {
        /* ignore */
      }

      await refreshUser();
      navigate(from, { replace: true });
    } catch (err) {
      clearRegisterSuccess();
      setError(loginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    clearRegisterSuccess();
    clearPasswordRelogin();
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await loginWithGoogleBackend(idToken);
      
      const { customToken, uid, role } = res.data;
      const userCred = await signInWithCustomToken(firebaseAuth, customToken);
      const finalIdToken = await userCred.user.getIdToken();

      writeAuthStorage(
        {
          idToken: finalIdToken,
          uid,
          role: normalizeRole(role),
        },
        rememberMe
      );
      
      await refreshUser();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Error en Google Login:', err);
      setError('Ocurrió un error al iniciar sesión con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <AuthLayout backLink={{ to: '/', label: 'Inicio' }}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight" style={{ height: 39 }}>
          Bienvenido de nuevo
        </h2>
        <p className="mt-1 text-muted text-sm">Inicia sesión en tu cuenta</p>
      </div>

      {/* Success banner */}
      {showRegisterSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
        >
          <span className="mt-0.5 shrink-0 text-emerald-400">
            <CheckCircleIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-emerald-400">Registro exitoso</p>
            <p className="mt-0.5 text-xs text-emerald-400/80">
              Ya puedes iniciar sesión con tu correo y contraseña.
            </p>
          </div>
        </div>
      )}

      {showPasswordRelogin && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-[#38BACC]/35 bg-[#38BACC]/10 px-4 py-3">
          <CheckCircleIcon />
          <div>
            <p className="text-sm font-medium text-[#7ee8f0]">Contraseña actualizada</p>
            <p className="mt-0.5 text-xs text-white/65">
              Por seguridad cerramos tu sesión. Vuelve a iniciar sesión con tu correo y tu nueva contraseña.
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <span className="text-red-400 mt-0.5 flex-shrink-0"><AlertIcon /></span>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="correo@ejemplo.com"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => {
            clearRegisterSuccess();
            clearPasswordRelogin();
            setEmail(e.target.value);
          }}
          required
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="Ingresa tu contraseña"
          icon={<LockIcon />}
          showPasswordToggle
          value={password}
          onChange={(e) => {
            clearRegisterSuccess();
            clearPasswordRelogin();
            setPassword(e.target.value);
          }}
          required
        />

        {/* Recordarme y recuperar contraseña */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
                rememberMe
                  ? 'bg-[#00d4c8] border-[#00d4c8]'
                  : 'bg-transparent border-white/25 group-hover:border-white/50'
              }`}>
                {rememberMe && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 6l3 3 5-5" stroke="#0d1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-white/55 group-hover:text-white/75 transition-colors">Recordarme</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm text-[#00d4c8] hover:text-[#00ece0] transition-colors font-medium"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
          {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-white/10" />
          <span className="text-white/30 text-xs">o</span>
          <hr className="flex-1 border-white/10" />
        </div>

        {/* Google button */}
        <Button
          type="button"
          variant="outline"
          fullWidth
          leftIcon={!isGoogleLoading && <GoogleIcon />}
          loading={isGoogleLoading}
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
        >
          {isGoogleLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
        </Button>
      </form>

      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-white/40">
        ¿No tienes una cuenta?{' '}
        <Link to="/register" className="text-[#00d4c8] hover:text-[#00ece0] font-medium transition-colors">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  );
}
