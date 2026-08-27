import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../../src/ui/theme';
import { ThemeToggle } from '../../../src/ui/ThemeToggle';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark');
});

describe('ThemeToggle', () => {
  it('renders a labelled button that flips the theme when clicked', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const button = screen.getByRole('button', { name: 'Cambiar tema' });
    expect(button).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    await userEvent.click(button);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
