import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, PageLayout } from '../components';
import { register } from '../services/authService';

const trim = (s: string) => s.trim();
const MIN_PASSWORD_LENGTH = 8;

function getEmailError(value: string): string | undefined {
  return trim(value) ? undefined : 'Este campo es obligatorio';
}

function getPasswordError(value: string): string | undefined {
  if (!value) return 'Este campo es obligatorio';
  if (value.length < MIN_PASSWORD_LENGTH) return 'La contraseña debe tener al menos 8 caracteres';
  return undefined;
}

function getConfirmPasswordError(password: string, confirmPassword: string): string | undefined {
  if (confirmPassword.length === 0) return undefined;
  return password === confirmPassword ? undefined : 'Las contraseñas no coinciden';
}

function getDisplayNameError(value: string): string | undefined {
  return trim(value) ? undefined : 'Este campo es obligatorio';
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const confirmPasswordError = getConfirmPasswordError(password, confirmPassword);
  const displayNameError = getDisplayNameError(displayName);

  const isFormValid =
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    !displayNameError;

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
        role: 'client',
      });
      navigate('/login', { state: { registerSuccess: true }, replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo completar el registro. Inténtalo nuevamente.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout title="Crear cuenta" maxWidth="sm">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {submitError}
            </p>
          )}
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={isSubmitted ? emailError : undefined}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={isSubmitted ? passwordError : undefined}
            showPasswordToggle
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPasswordError}
            showPasswordToggle
            required
          />
          <Input
            label="Nombre"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={isSubmitted ? displayNameError : undefined}
            required
          />
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-neutral-600 text-center">
          ¿Ya tienes cuenta? <Link to="/login" className="font-medium text-neutral-900 underline">Iniciar sesión</Link>
        </p>
      </Card>
    </PageLayout>
  );
}
