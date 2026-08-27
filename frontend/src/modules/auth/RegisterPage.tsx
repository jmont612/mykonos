import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../api/client';
import { formatApiErrorDetails } from '../../shared/formatApiErrorDetails';
import type { Role } from '../../api/types';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Field } from '../../ui/Field';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('BUYER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, name, role });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? formatApiErrorDetails(err) : 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">Crear cuenta</h1>
      <Card className="p-6">
        {error && (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nombre">
            {(control) => (
              <Input value={name} onChange={(e) => setName(e.target.value)} required {...control} />
            )}
          </Field>
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
                minLength={6}
                {...control}
              />
            )}
          </Field>
          <Field label="Rol">
            {(control) => (
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)} {...control}>
                <option value="BUYER">Comprador</option>
                <option value="SELLER">Vendedor</option>
              </Select>
            )}
          </Field>
          <Button type="submit" loading={submitting} className="w-full">
            Crear cuenta
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-sm text-muted">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
