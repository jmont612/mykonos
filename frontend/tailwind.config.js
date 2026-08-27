/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-bg)',
        surface: { DEFAULT: 'var(--color-surface)', 2: 'var(--color-surface-2)' },
        fg: 'var(--color-fg)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          fg: 'var(--color-primary-fg)',
        },
        success: { DEFAULT: 'var(--color-success)', surface: 'var(--color-success-surface)' },
        warning: { DEFAULT: 'var(--color-warning)', surface: 'var(--color-warning-surface)' },
        danger: {
          DEFAULT: 'var(--color-danger)',
          surface: 'var(--color-danger-surface)',
          fg: 'var(--color-danger-fg)',
        },
      },
      borderColor: { DEFAULT: 'var(--color-border)' },
      borderRadius: { DEFAULT: 'var(--radius)', sm: 'var(--radius-sm)' },
      boxShadow: { sm: 'var(--shadow-sm)', md: 'var(--shadow-md)' },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
