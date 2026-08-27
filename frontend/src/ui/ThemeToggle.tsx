import { useTheme } from './theme';
import { MoonIcon, SunIcon } from './icons';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      className="ui-focus inline-grid h-9 w-9 place-items-center rounded-sm border border-border bg-surface text-fg transition-colors hover:bg-surface-2"
    >
      {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
    </button>
  );
}
