import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card, PageLayout } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../services/authService';
import { normalizeRole } from '../utils/role';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationState = location.state as { from?: { pathname: string }; registerSuccess?: boolean } | undefined;
  const from = locationState?.from?.pathname ?? '/home';
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(
    () => locationState?.registerSuccess === true
  );

  function clearRegisterSuccess() {
    setShowRegisterSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearRegisterSuccess();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await login({ email, password });
      const { idToken, refreshToken, uid, role } = res.data;
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('uid', uid);
      localStorage.setItem('role', normalizeRole(role));
      await refreshUser();
      navigate(from, { replace: true });
    } catch {
      clearRegisterSuccess();
      setError('Correo o contraseña incorrectos');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout title="Iniciar sesión" maxWidth="sm" variant="dark">
      <Card variant="dark">
        <form onSubmit={handleSubmit} className="space-y-4">
          {showRegisterSuccess && (
            <p className="text-sm text-green-700 bg-green-50 p-2 rounded" role="status">
              Registro exitoso. Ahora inicia sesión.
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              clearRegisterSuccess();
              setEmail(e.target.value);
            }}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              clearRegisterSuccess();
              setPassword(e.target.value);
            }}
            showPasswordToggle
            required
          />
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-neutral-600 text-center">
          ¿No tienes cuenta? <Link to="/register" className="font-medium text-neutral-900 underline">Registrarse</Link>
        </p>
      </Card>
    </PageLayout>
  );
}
