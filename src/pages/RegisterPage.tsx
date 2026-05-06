import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components';
import { AuthLayout } from '../components/AuthLayout';
import { register, loginWithGoogleBackend } from '../api/authService';
import { config } from '../config/app';
import { useAuth } from '../contexts/AuthContext';
import {
  IDENTITY_DOCUMENT_OPTIONS,
  identityDocumentLabel,
  getIdentityInputHint,
  getIdentityNumberError,
  getIdentityPlaceholder,
  normalizeIdentityNumber,
  type IdentityDocumentType,
} from '../helpers/identification';
import { normalizeRole } from '../helpers/role';
import type { RegistrationRole } from '../types/auth';
import { registerErrorMessage } from '../helpers/authErrors';
import {
  SESSION_KEY_POST_REGISTER_LOGIN,
  SESSION_KEY_REGISTRATION_IDENTIFICATION,
} from '../constants/sessionStorageKeys';
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

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
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

const IdCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="12" cy="11" r="2" />
    <path d="M7 17h10" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function persistRegistrationIdentification(
  email: string,
  role: string,
  identityType: IdentityDocumentType,
  rawNumber: string
) {
  const identificationNumber = normalizeIdentityNumber(identityType, rawNumber);
  try {
    sessionStorage.setItem(
      SESSION_KEY_REGISTRATION_IDENTIFICATION,
      JSON.stringify({
        email,
        role,
        identificationType: identityType,
        identificationNumber,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    /* private mode */
  }
}

function IdentityTypeSelect({
  value,
  onChange,
  selectId,
}: {
  value: IdentityDocumentType;
  onChange: (v: IdentityDocumentType) => void;
  selectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const borderState = focused
    ? 'border-[#00d4c8] ring-2 ring-[#00d4c8]/20'
    : 'border-white/10';

  return (
    <div className="w-full flex flex-col gap-1.5 relative" ref={wrapRef}>
      <label
        htmlFor={selectId}
        className={`text-sm font-medium transition-colors duration-150 ${
          focused ? 'text-[#00d4c8]' : 'text-muted'
        }`}
      >
        Tipo de identificación
      </label>
      <button
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        className={[
          'w-full flex items-center justify-between gap-2 rounded-lg border bg-[#1a1d24] text-white',
          'py-3 px-4 text-sm text-left outline-none transition-all duration-200',
          borderState,
        ].join(' ')}
      >
        <span>{identityDocumentLabel(value)}</span>
        <span className={`text-white/35 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 top-full left-0 right-0 mt-1 py-1 rounded-lg border border-white/10 bg-[#1a1d24] shadow-lg max-h-48 overflow-auto"
        >
          {IDENTITY_DOCUMENT_OPTIONS.map((opt) => (
            <li key={opt.value} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className={[
                  'w-full text-left px-4 py-2.5 text-sm transition-colors',
                  opt.value === value
                    ? 'bg-[#00d4c8]/15 text-[#00d4c8]'
                    : 'text-white/80 hover:bg-white/5',
                ].join(' ')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Helpers ── */
const trim = (s: string) => s.trim();
const MIN_PASSWORD_LENGTH = 8;

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

const REGISTRATION_ROLE_OPTIONS: readonly { value: RegistrationRole; label: string }[] = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'artista', label: 'Artista' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [accountRole, setAccountRole] = useState<RegistrationRole>('cliente');
  const [identityType, setIdentityType] = useState<IdentityDocumentType>('cedula');
  const [identityNumber, setIdentityNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    setIdentityNumber('');
  }, [identityType]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /* ── Derived errors ── */
  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const confirmPasswordError = getConfirmPasswordError(password, confirmPassword);
  const displayNameError = getDisplayNameError(displayName);
  const normalizedIdentityNumber = normalizeIdentityNumber(identityType, identityNumber);
  const identityNumberError = getIdentityNumberError(identityType, normalizedIdentityNumber);
  const identityMaxLength = identityType === 'cedula' ? 10 : identityType === 'ruc' ? 13 : 20;

  const isFormValid =
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    !displayNameError &&
    !identityNumberError &&
    agreedToTerms;

  /* ── Show error only after first submit OR if user has blurred the field ── */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  function showError(field: string, error: string | undefined) {
    return isSubmitted || touched[field] ? error : undefined;
  }

  const [showSuccess, setShowSuccess] = useState(false);

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitted(true);

    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const basePayload = {
        email: trim(email),
        password,
        displayName: trim(displayName),
        role: accountRole,
      };
      await register(
        config.registrationIdentificationMode === 'api'
          ? {
              ...basePayload,
              identificationType: identityType,
              identificationNumber: normalizedIdentityNumber,
            }
          : basePayload
      );
      if (config.registrationIdentificationMode === 'local') {
        persistRegistrationIdentification(trim(email), accountRole, identityType, identityNumber);
      }
      setShowSuccess(true);
      try {
        sessionStorage.setItem(SESSION_KEY_POST_REGISTER_LOGIN, '1');
      } catch {
        /* ignore private mode */
      }
      setTimeout(() => {
        navigate('/login', { state: { registerSuccess: true }, replace: true });
      }, 2000);
    } catch (err) {
      setSubmitError(registerErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Google Submit ── */
  async function handleGoogleLogin() {
    setSubmitError('');
    touch('identityNumber');
    const normId = normalizeIdentityNumber(identityType, identityNumber);
    const idErr = getIdentityNumberError(identityType, normId);
    if (idErr) {
      setSubmitError(idErr);
      return;
    }

    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await loginWithGoogleBackend(idToken, { role: accountRole });
      
      const { customToken, uid, role } = res.data;
      const userCred = await signInWithCustomToken(firebaseAuth, customToken);
      const finalIdToken = await userCred.user.getIdToken();
      
      localStorage.setItem('idToken', finalIdToken);
      localStorage.setItem('uid', uid);
      localStorage.setItem('role', normalizeRole(role));
      
      await refreshUser();
      if (config.registrationIdentificationMode === 'local' && result.user.email) {
        persistRegistrationIdentification(
          result.user.email,
          normalizeRole(role),
          identityType,
          identityNumber
        );
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error en Google Login:', err);
      setSubmitError('Ocurrió un error al registrarse con Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <AuthLayout backLink={{ to: '/login', label: 'Volver atrás' }}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight" style={{ height: 39 }}>
          Comienza ahora
        </h2>
        <p className="mt-1 text-muted text-sm">Crea tu cuenta</p>
      </div>

      {/* Success banner */}
      {showSuccess && (
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
              Tu cuenta ha sido creada. Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      )}

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
          label="Nombre completo"
          type="text"
          autoComplete="name"
          placeholder="Juan Pérez"
          icon={<UserIcon />}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={() => touch('displayName')}
          error={showError('displayName', displayNameError)}
          success={!!displayName && !displayNameError}
          required
        />

        {/* Account type */}
        <fieldset className="border-0 p-0 m-0 min-w-0">
          <legend className="text-sm font-medium text-white/80 mb-2">Tipo de cuenta</legend>
          <div className="flex gap-2" role="group" aria-label="Tipo de cuenta">
            {REGISTRATION_ROLE_OPTIONS.map(({ value, label }) => {
              const selected = accountRole === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccountRole(value)}
                  className={[
                    'flex-1 rounded-lg border py-2.5 px-3 text-sm font-medium transition-all duration-200',
                    selected
                      ? 'border-[#00d4c8] bg-[#00d4c8]/10 text-white'
                      : 'border-white/15 bg-transparent text-white/60 hover:border-white/35 hover:text-white/85',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <IdentityTypeSelect
          selectId="register-identity-type"
          value={identityType}
          onChange={setIdentityType}
        />

        <Input
          label="Número de identificación"
          type="text"
          autoComplete="off"
          inputMode={identityType === 'pasaporte' ? 'text' : 'numeric'}
          maxLength={identityMaxLength}
          placeholder={getIdentityPlaceholder(identityType)}
          icon={<IdCardIcon />}
          value={identityNumber}
          onChange={(e) => {
            const v = e.target.value;
            if (identityType === 'pasaporte') {
              setIdentityNumber(v.toUpperCase().replace(/[^A-Z0-9]/gi, '').slice(0, 20));
            } else {
              const digits = v.replace(/\D/g, '');
              const max = identityType === 'cedula' ? 10 : 13;
              setIdentityNumber(digits.slice(0, max));
            }
          }}
          onBlur={() => touch('identityNumber')}
          error={showError('identityNumber', identityNumberError)}
          hint={!showError('identityNumber', identityNumberError) ? getIdentityInputHint(identityType) : undefined}
          success={!!identityNumber && !identityNumberError}
          required
        />

        {/* Email */}
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="correo@ejemplo.com"
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
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Crea tu contraseña"
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
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Confirma tu contraseña"
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
            Acepto los{' '}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00d4c8] hover:text-[#00ece0] font-medium transition-colors"
            >
              términos y condiciones
            </Link>
          </span>
        </label>
        {isSubmitted && !agreedToTerms && (
          <p className="text-xs text-red-400 -mt-2">Debes aceptar los términos para continuar.</p>
        )}

        {/* Submit */}
        <Button type="submit" variant="primary" fullWidth loading={isSubmitting} className="mt-1">
          {isSubmitting ? 'Creando tu cuenta…' : 'Registrarse'}
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
          onClick={handleGoogleLogin}
          loading={isGoogleLoading}
          disabled={isSubmitting}
        >
          {isGoogleLoading ? 'Conectando...' : 'Registrarse con Google'}
        </Button>
      </form>

      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-white/40">
        ¿Ya tienes una cuenta?{' '}
        <Link to="/login" className="text-[#00d4c8] hover:text-[#00ece0] font-medium transition-colors">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
