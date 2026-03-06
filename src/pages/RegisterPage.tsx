import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Card, PageLayout } from '../components';
import { register } from '../services/authService';

const trim = (s: string) => s.trim();

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; displayName?: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const e = trim(email);
    const p = password;
    const d = trim(displayName);
    const errors: { email?: string; password?: string; displayName?: string } = {};
    if (!e) errors.email = 'Email is required';
    if (!p) errors.password = 'Password is required';
    if (!d) errors.displayName = 'Display name is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await register({
        email: trim(email),
        password,
        displayName: trim(displayName),
        role: 'client',
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout title="Create account" maxWidth="sm">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
              {submitError}
            </p>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />
          <Input
            label="Display name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={fieldErrors.displayName}
            required
          />
          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-neutral-600 text-center">
          Already have an account? <Link to="/login" className="font-medium text-neutral-900 underline">Log in</Link>
        </p>
      </Card>
    </PageLayout>
  );
}
