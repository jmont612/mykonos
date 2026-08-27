import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../api/client';
import { formatApiErrorDetails } from '../../shared/formatApiErrorDetails';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Field } from '../../ui/Field';
import { Input } from '../../ui/Input';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? formatApiErrorDetails(err) : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
      <Card className="p-6">
        {error && (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            {(control) => (
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                {...control}
              />
            )}
          </Field>
          <Field label="Contraseña">
            {(control) => (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                {...control}
              />
            )}
          </Field>
          <Button type="submit" loading={submitting} className="w-full">
            Iniciar sesión
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-sm text-muted">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
