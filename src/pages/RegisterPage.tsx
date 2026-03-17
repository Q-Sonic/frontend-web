import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components';
import { AuthLayout } from '../components/AuthLayout';
import { register, loginWithGoogleBackend } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';
import { normalizeRole } from '../helpers/role';
import { signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../config/firebase';

/* ── Icons ── */
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
  </svg>
);

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

/* ── Helpers ── */
const trim = (s: string) => s.trim();
const MIN_PASSWORD_LENGTH = 8;
const DUPLICATE_EMAIL_SPANISH = 'Este correo ya pertenece a una cuenta existente.';

function getRegisterErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? '');
  if (/already in use/i.test(message)) return DUPLICATE_EMAIL_SPANISH;
  return message || 'No se pudo completar el registro. Inténtalo nuevamente.';
}

function getEmailError(value: string): string | undefined {
  if (!trim(value)) return 'Este campo es obligatorio';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un correo válido';
  return undefined;
}

function getPasswordError(value: string): string | undefined {
  if (!value) return 'Este campo es obligatorio';
  if (value.length < MIN_PASSWORD_LENGTH) return `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`;
  return undefined;
}

function getConfirmPasswordError(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return undefined;
  return password === confirmPassword ? undefined : 'Las contraseñas no coinciden';
}

function getDisplayNameError(value: string): string | undefined {
  return trim(value) ? undefined : 'Este campo es obligatorio';
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /* ── Derived errors ── */
  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const confirmPasswordError = getConfirmPasswordError(password, confirmPassword);
  const displayNameError = getDisplayNameError(displayName);

  const isFormValid =
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    !displayNameError &&
    agreedToTerms;

  /* ── Show error only after first submit OR if user has blurred the field ── */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  function showError(field: string, error: string | undefined) {
    return isSubmitted || touched[field] ? error : undefined;
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitted(true);

    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await register({
        email: trim(email),
        password,
        displayName: trim(displayName),
        role: 'cliente',
      });
      navigate('/login', { state: { registerSuccess: true }, replace: true });
    } catch (err) {
      setSubmitError(getRegisterErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Google Submit ── */
  async function handleGoogleLogin() {
    setSubmitError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await loginWithGoogleBackend(idToken);
      
      const { customToken, uid, role } = res.data;
      const userCred = await signInWithCustomToken(firebaseAuth, customToken);
      const finalIdToken = await userCred.user.getIdToken();
      
      localStorage.setItem('idToken', finalIdToken);
      localStorage.setItem('uid', uid);
      localStorage.setItem('role', normalizeRole(role));
      
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error en Google Login:', err);
      setSubmitError('Ocurrió un error al registrarse con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Get Started Now</h2>
        <p className="mt-1 text-white/45 text-sm">Let&apos;s create your account</p>
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <span className="text-red-400 mt-0.5 flex-shrink-0"><AlertIcon /></span>
          <p className="text-red-400 text-sm">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Full Name */}
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Dominic Matthew"
          icon={<UserIcon />}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={() => touch('displayName')}
          error={showError('displayName', displayNameError)}
          success={!!displayName && !displayNameError}
          required
        />

        {/* Email */}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="domat@example.com"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => touch('email')}
          error={showError('email', emailError)}
          success={!!email && !emailError}
          required
        />

        {/* Password */}
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Set your password"
          icon={<LockIcon />}
          showPasswordToggle
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => touch('password')}
          error={showError('password', passwordError)}
          hint={!showError('password', passwordError) ? 'Mínimo 8 caracteres' : undefined}
          success={!!password && !passwordError}
          required
        />

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          icon={<LockIcon />}
          showPasswordToggle
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => touch('confirmPassword')}
          error={showError('confirmPassword', confirmPasswordError)}
          success={!!confirmPassword && !confirmPasswordError && !!password}
          required
        />

        {/* Terms checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none group mt-1">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
              agreedToTerms
                ? 'bg-[#00d4c8] border-[#00d4c8]'
                : isSubmitted && !agreedToTerms
                ? 'bg-transparent border-red-500'
                : 'bg-transparent border-white/25 group-hover:border-white/50'
            }`}>
              {agreedToTerms && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 6l3 3 5-5" stroke="#0d1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-white/55 group-hover:text-white/75 transition-colors leading-5">
            I agree to the{' '}
            <Link to="/terms" className="text-[#00d4c8] hover:text-[#00ece0] font-medium transition-colors">
              Term &amp; Condition
            </Link>
          </span>
        </label>
        {isSubmitted && !agreedToTerms && (
          <p className="text-xs text-red-400 -mt-2">Debes aceptar los términos para continuar.</p>
        )}

        {/* Submit */}
        <Button type="submit" variant="primary" fullWidth loading={isSubmitting} className="mt-1">
          {isSubmitting ? 'Creating account…' : 'Sign up'}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-white/10" />
          <span className="text-white/30 text-xs">or</span>
          <hr className="flex-1 border-white/10" />
        </div>

        {/* Google button */}
        <Button
          type="button"
          variant="outline"
          fullWidth
          leftIcon={!isGoogleLoading && <GoogleIcon />}
          onClick={handleGoogleLogin}
          loading={isGoogleLoading}
          disabled={isSubmitting}
        >
          {isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}
        </Button>
      </form>

      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-white/40">
        Already have an account?{' '}
        <Link to="/login" className="text-[#00d4c8] hover:text-[#00ece0] font-medium transition-colors">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
