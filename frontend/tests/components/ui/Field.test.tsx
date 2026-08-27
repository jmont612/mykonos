import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from '../../../src/ui/Field';

describe('Field', () => {
  it('associates the label with the control it renders', () => {
    render(
      <Field label="Email">{(control) => <input type="email" {...control} />}</Field>,
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('shows the hint when there is no error', () => {
    render(
      <Field label="Precio" hint="En pesos">
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(screen.getByLabelText('Precio')).toHaveAccessibleDescription('En pesos');
  });

  it('wires the error into aria-describedby and marks the control invalid', () => {
    render(
      <Field label="Precio" hint="En pesos" error="Debe ser mayor a 0">
        {(control) => <input {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText('Precio');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Debe ser mayor a 0');
    expect(screen.queryByText('En pesos')).not.toBeInTheDocument();
  });
});
