import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components';
import {
  ApiError,
  changeAccountEmail,
  changeAccountPassword,
  getAccountChangeStatus,
  requestAccountChangeCode,
  verifyAccountChangeCode,
} from '../../api';
import type { AccountChangeStatus } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { isBackendRoleCliente } from '../../helpers/role';

const ACCENT_BORDER = 'border-[#38BACC]/35';

function unlockReadOnlyOnFocus(e: React.FocusEvent<HTMLInputElement>) {
  if (e.currentTarget.hasAttribute('readonly')) {
    e.currentTarget.removeAttribute('readonly');
  }
}

function AutoFillDecoyFields() {
  return (
    <div
      className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      aria-hidden
    >
      <input type="text" tabIndex={-1} autoComplete="username" />
      <input type="password" tabIndex={-1} autoComplete="current-password" />
    </div>
  );
}

export function ProfileClientePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const formScope = user?.uid ?? 'self';

  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [changeStatus, setChangeStatus] = useState<AccountChangeStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const isCliente = isBackendRoleCliente(user?.role);
  const displayName = useMemo(() => user?.displayName?.trim() || 'Cliente', [user?.displayName]);
  const accountEmail = useMemo(() => user?.email?.trim() ?? '', [user?.email]);

  const loadChangeStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const s = await getAccountChangeStatus();
      setChangeStatus(s);
    } catch {
      setChangeStatus({ verified: false, pendingCode: false, validUntil: null });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    void loadChangeStatus();
  }, [loadChangeStatus]);

  const clearEmailMessages = () => setEmailMessage(null);
  const clearPasswordMessages = () => setPasswordMessage(null);

  if (!user?.uid) return <Navigate to="/login" replace />;
  if (!isCliente) return <Navigate to="/client" replace />;

  const verified = changeStatus?.verified === true;
  const pendingCode = changeStatus?.pendingCode === true;
  const validUntilLabel = changeStatus?.validUntil
    ? new Date(changeStatus.validUntil).toLocaleString('es', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : null;

  async function handleSendCode() {
    setVerifyMessage(null);
    setSendingCode(true);
    try {
      await requestAccountChangeCode();
      setVerifyMessage({
        type: 'ok',
        text: 'Revisa tu bandeja (y spam). Te enviamos un código de 6 dígitos.',
      });
      await loadChangeStatus();
    } catch (err) {
      setVerifyMessage({
        type: 'err',
        text:
          err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'No se pudo enviar el código.',
      });
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setVerifyMessage(null);
    const code = codeInput.replace(/\D/g, '').slice(0, 6);
    if (code.length < 6) {
      setVerifyMessage({ type: 'err', text: 'Introduce el código de 6 dígitos.' });
      return;
    }
    setVerifyingCode(true);
    try {
      await verifyAccountChangeCode(code);
      setCodeInput('');
      setVerifyMessage({ type: 'ok', text: 'Código correcto. Ya puedes actualizar correo o contraseña.' });
      await loadChangeStatus();
    } catch (err) {
      setVerifyMessage({
        type: 'err',
        text: err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Código no válido.',
      });
    } finally {
      setVerifyingCode(false);
    }
  }

  async function handleSaveEmail(e: React.FormEvent) {
    e.preventDefault();
    clearEmailMessages();
    const trimmed = newEmail.trim().toLowerCase();
    const confirm = confirmEmail.trim().toLowerCase();
    if (!trimmed || !confirm) {
      setEmailMessage({ type: 'err', text: 'Completa correo y confirmación.' });
      return;
    }
    if (trimmed !== confirm) {
      setEmailMessage({ type: 'err', text: 'Los correos no coinciden.' });
      return;
    }
    if (trimmed === accountEmail.toLowerCase()) {
      setEmailMessage({ type: 'err', text: 'El nuevo correo es igual al actual.' });
      return;
    }
    setEmailSaving(true);
    try {
      await changeAccountEmail({ newEmail: trimmed });
      setEmailMessage({ type: 'ok', text: 'Correo actualizado. Tu próximo inicio de sesión será con el nuevo correo.' });
      setNewEmail('');
      setConfirmEmail('');
      await refreshUser();
      await loadChangeStatus();
    } catch (err) {
      const text =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'No se pudo actualizar el correo.';
      setEmailMessage({ type: 'err', text });
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    clearPasswordMessages();
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'err', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'err', text: 'Las contraseñas no coinciden.' });
      return;
    }
    setPasswordSaving(true);
    try {
      await changeAccountPassword({ newPassword });
      setNewPassword('');
      setConfirmPassword('');
      logout();
      navigate('/login', {
        replace: true,
        state: { passwordChangedRelogin: true },
      });
    } catch (err) {
      const text =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.';
      setPasswordMessage({ type: 'err', text });
    } finally {
      setPasswordSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#38BACC]/60 focus:outline-none';

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-8 lg:pl-12 lg:pr-10 pt-8 sm:pt-10 lg:pt-12 pb-16">
      <div className={`rounded-3xl ${ACCENT_BORDER} bg-[#111214] p-6 sm:p-8 lg:p-10 shadow-[0_0_40px_rgba(56,186,204,0.08)]`}>
        <header className="mb-8 space-y-3">
          <p className="text-sm font-medium text-white/80">{displayName}</p>
          <p className="inline-block rounded-full border border-[#38BACC]/40 bg-[#38BACC]/10 px-3 py-1 text-xs font-medium text-[#7ee8f0]">
            Seguridad y acceso
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Configuración de Acceso</h1>
          <p className="text-sm text-white/55 max-w-2xl leading-relaxed">
            Primero verifica tu identidad con un código que enviamos a tu correo. Después podrás cambiar el correo o la
            contraseña.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm">
            <span className="text-white/50">Correo actual (cuenta)</span>
            <p className="mt-1 font-medium text-white">{accountEmail || '—'}</p>
          </div>
        </header>

        <section className="relative mb-8 space-y-4 rounded-2xl border border-[#38BACC]/25 bg-[#38BACC]/5 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">1. Verificación por correo</h2>
          {statusLoading ? (
            <p className="text-sm text-white/50">Cargando estado…</p>
          ) : (
            <>
              {verifyMessage && (
                <p
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    verifyMessage.type === 'ok'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-red-500/40 bg-red-500/10 text-red-200'
                  }`}
                >
                  {verifyMessage.text}
                </p>
              )}
              {verified ? (
                <p className="text-sm text-[#7ee8f0]">
                  Identidad verificada.{validUntilLabel ? ` Puedes aplicar cambios hasta el ${validUntilLabel}.` : ''}
                </p>
              ) : (
                <p className="text-sm text-white/60">
                  Enviaremos un código de 6 dígitos a <span className="text-white/90">{accountEmail || 'tu correo'}</span>.
                </p>
              )}
              {!verified && (
                <div className="flex flex-wrap items-end gap-3">
                  <Button type="button" onClick={handleSendCode} loading={sendingCode} disabled={!accountEmail}>
                    Enviar código
                  </Button>
                </div>
              )}
              {!verified && pendingCode && (
                <form onSubmit={handleVerifyCode} className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end" autoComplete="off">
                  <label className="block min-w-0 flex-1 space-y-2">
                    <span className="text-xs font-medium text-white/60">Código de 6 dígitos</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      name={`client-verify-code-${formScope}`}
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className={inputClass}
                      placeholder="••••••"
                    />
                  </label>
                  <Button type="submit" loading={verifyingCode} variant="secondary">
                    Verificar
                  </Button>
                </form>
              )}
            </>
          )}
        </section>

        {!verified && !statusLoading && (
          <p className="mb-6 text-center text-sm text-white/45">
            Completa la verificación arriba para desbloquear los formularios de correo y contraseña.
          </p>
        )}

        <div className={`grid gap-8 lg:grid-cols-2 lg:gap-12 ${!verified ? 'pointer-events-none opacity-40' : ''}`}>
          <form
            onSubmit={handleSaveEmail}
            autoComplete="off"
            className="relative space-y-4 rounded-2xl border border-white/10 bg-white/3 p-5 sm:p-6"
          >
            <AutoFillDecoyFields />
            <h2 className="text-lg font-semibold text-white">Cambiar correo</h2>
            {emailMessage && (
              <p
                className={`rounded-lg border px-3 py-2 text-sm ${
                  emailMessage.type === 'ok'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}
              >
                {emailMessage.text}
              </p>
            )}
            <label className="block space-y-2">
              <span className="text-xs font-medium text-white/60">Nuevo correo</span>
              <input
                type="text"
                inputMode="email"
                name={`client-settings-mail-a-${formScope}`}
                id={`client-settings-mail-a-${formScope}`}
                autoComplete="off"
                spellCheck={false}
                readOnly
                onFocus={unlockReadOnlyOnFocus}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  clearEmailMessages();
                }}
                className={inputClass}
                placeholder="nuevo@correo.com"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-white/60">Confirmar nuevo correo</span>
              <input
                type="text"
                inputMode="email"
                name={`client-settings-mail-b-${formScope}`}
                id={`client-settings-mail-b-${formScope}`}
                autoComplete="off"
                spellCheck={false}
                readOnly
                onFocus={unlockReadOnlyOnFocus}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                value={confirmEmail}
                onChange={(e) => {
                  setConfirmEmail(e.target.value);
                  clearEmailMessages();
                }}
                className={inputClass}
                placeholder="repite el correo nuevo"
              />
            </label>
            <Button type="submit" loading={emailSaving} className="mt-2 w-full sm:w-auto" disabled={!verified}>
              Guardar cambios
            </Button>
          </form>

          <form
            onSubmit={handleSavePassword}
            autoComplete="off"
            className="relative space-y-4 rounded-2xl border border-white/10 bg-white/3 p-5 sm:p-6"
          >
            <AutoFillDecoyFields />
            <h2 className="text-lg font-semibold text-white">Cambiar contraseña</h2>
            <p className="text-xs text-white/45">
              Al guardar, cerramos tu sesión y debes ingresar nuevamente.
            </p>
            {passwordMessage && (
              <p
                className={`rounded-lg border px-3 py-2 text-sm ${
                  passwordMessage.type === 'ok'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}
              >
                {passwordMessage.text}
              </p>
            )}
            <label className="block space-y-2">
              <span className="text-xs font-medium text-white/60">Nueva contraseña</span>
              <input
                type="password"
                name={`client-settings-pw-a-${formScope}`}
                id={`client-settings-pw-a-${formScope}`}
                autoComplete="new-password"
                readOnly
                onFocus={unlockReadOnlyOnFocus}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearPasswordMessages();
                }}
                className={inputClass}
                placeholder="Mínimo 8 caracteres"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-white/60">Confirmar nueva contraseña</span>
              <input
                type="password"
                name={`client-settings-pw-b-${formScope}`}
                id={`client-settings-pw-b-${formScope}`}
                autoComplete="new-password"
                readOnly
                onFocus={unlockReadOnlyOnFocus}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearPasswordMessages();
                }}
                className={inputClass}
                placeholder="Repite la nueva contraseña"
              />
            </label>
            <Button type="submit" loading={passwordSaving} className="mt-2 w-full sm:w-auto" disabled={!verified}>
              Guardar cambios
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
