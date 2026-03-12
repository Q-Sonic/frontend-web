import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BackButton, Button, Input, Card, PageLayout } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { register } from '../../services/authService';
import { isBackendRoleAdmin } from '../../utils/role';
import { getRequiredError } from '../../utils/validation';

const MIN_PASSWORD_LENGTH = 8;

function getPasswordError(value: string): string | undefined {
  if (!value) return 'Este campo es obligatorio';
  if (value.length < MIN_PASSWORD_LENGTH) return 'La contraseña debe tener al menos 8 caracteres';
  return undefined;
}

export function CreateArtistPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = isBackendRoleAdmin(user?.role);

  const emailError = getRequiredError(email);
  const passwordError = getPasswordError(password);
  const displayNameError = getRequiredError(displayName);
  const isFormValid = !emailError && !passwordError && !displayNameError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');
    setIsSubmitted(true);
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role: 'artista',
      });
      setSuccessMessage(`Artista creado correctamente. El artista puede iniciar sesión con: ${email.trim()}`);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setIsSubmitted(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo crear el artista.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <PageLayout title="Crear artista" maxWidth="md" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
        <Card variant="dark" title="Acceso denegado">
          <p className="text-neutral-600 mb-4">Solo los administradores pueden crear artistas.</p>
          <Link to="/home">
            <Button variant="primary">Volver al inicio</Button>
          </Link>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Crear artista" maxWidth="sm" variant="dark" topContent={<BackButton className="text-neutral-400 hover:text-white" />}>
      <Card variant="dark" title="Crear perfil de artista">
        <p className="text-neutral-600 text-sm mb-4">
          Registra el correo del artista y asígnale una contraseña temporal. Se asignará el rol
          artista y podrá iniciar sesión después.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <p className="text-sm text-green-700 bg-green-50 p-2 rounded" role="status">
              {successMessage}
            </p>
          )}
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {submitError}
            </p>
          )}
          <Input
            label="Correo del artista"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={isSubmitted ? emailError : undefined}
            required
          />
          <Input
            label="Contraseña temporal"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={isSubmitted ? passwordError : undefined}
            showPasswordToggle
            required
          />
          <Input
            label="Nombre (display name)"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={isSubmitted ? displayNameError : undefined}
            required
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear artista'}
            </Button>
            <Link to="/home">
              <Button type="button" variant="secondary">
                Volver
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
