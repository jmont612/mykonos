import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from '../../../src/ui/Alert';

describe('Alert', () => {
  it('renders danger alerts with role="alert"', () => {
    render(<Alert variant="danger">Algo falló</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Algo falló');
  });

  it('renders success alerts with role="status"', () => {
    render(<Alert variant="success">Listo</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Listo');
  });

  it('defaults to the danger variant', () => {
    render(<Alert>Predeterminado</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
