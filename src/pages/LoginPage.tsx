import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button, Input, Card, PageLayout } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../services/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/profile';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await login({ email, password });
      const { idToken, refreshToken, uid, role } = res.data;
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('uid', uid);
      localStorage.setItem('role', role);
      await refreshUser();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout title="Log in" maxWidth="sm">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {error}
            </p>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-neutral-600 text-center">
          Don&apos;t have an account? <Link to="/register" className="font-medium text-neutral-900 underline">Register</Link>
        </p>
      </Card>
    </PageLayout>
  );
}
