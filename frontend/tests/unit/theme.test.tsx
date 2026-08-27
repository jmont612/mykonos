import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../../src/ui/theme';

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} data-theme-value={theme}>
      theme:{theme}
    </button>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('dark');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ThemeProvider / useTheme', () => {
  it('defaults to light when nothing is stored and the OS is not dark', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-theme-value', 'light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('reads the stored theme on mount', () => {
    localStorage.setItem('mykonos-theme', 'dark');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-theme-value', 'dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  it('falls back to prefers-color-scheme when nothing is stored', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true, media: '', addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-theme-value', 'dark');
  });

  it('toggle flips the theme and persists it', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('data-theme-value', 'dark');
    expect(localStorage.getItem('mykonos-theme')).toBe('dark');
  });

  it('useTheme outside a provider returns a working default and does not throw', () => {
    expect(() => render(<Probe />)).not.toThrow();
    expect(screen.getByRole('button')).toHaveAttribute('data-theme-value', 'light');
  });
});
