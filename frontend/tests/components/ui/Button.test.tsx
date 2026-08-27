import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../../src/ui/Button';

describe('Button', () => {
  it('renders its label with type="button" by default', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button');
  });

  it('honours an explicit type', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'submit');
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant="danger" size="sm">
        Eliminar
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveClass('btn', 'btn-danger', 'btn-sm');
  });

  it('is disabled while loading and renders a spinner', () => {
    render(<Button loading>Enviar</Button>);
    const btn = screen.getByRole('button', { name: 'Enviar' });
    expect(btn).toBeDisabled();
    expect(btn.querySelector('.ui-spinner')).not.toBeNull();
  });

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Ok</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Ok' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
