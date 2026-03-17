import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../components';
import { AuthLayout } from '../components/AuthLayout';

/* ── Icons ── */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5M12 5l-7 7 7 7" />
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // Solo UI — sin funcionalidad real
    setSubmitted(true);
  }

  return (
    <AuthLayout>
      {/* Icon badge */}
      <div className="mb-8 flex flex-col items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#00d4c8]/10 border border-[#00d4c8]/20
                        flex items-center justify-center text-[#00d4c8]">
          <LockOpenIcon />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h2>
          <p className="mt-1.5 text-white/45 text-sm max-w-[320px] leading-relaxed">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Success state */}
      {submitted ? (
        <div className="flex flex-col gap-6">
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-5 py-5">
            <div className="flex items-start gap-3">
              <svg className="text-emerald-400 mt-0.5 flex-shrink-0" width="18" height="18"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <div>
                <p className="text-emerald-400 text-sm font-semibold">¡Revisa tu correo!</p>
                <p className="text-emerald-400/70 text-xs mt-1 leading-relaxed">
                  Si <span className="font-medium text-emerald-400">{email}</span> está
                  registrado, recibirás un enlace para restablecer tu contraseña en los
                  próximos minutos.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => setSubmitted(false)}
          >
            Intentar con otro correo
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="domat@example.com"
            icon={<MailIcon />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" fullWidth>
            Send Reset Link
          </Button>
        </form>
      )}

      {/* Back to login */}
      <div className="mt-8 flex justify-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-white/40
                     hover:text-white/70 transition-colors duration-150"
        >
          <ArrowLeftIcon />
          Back to Sign In
        </Link>
      </div>
    </AuthLayout>
  );
}
