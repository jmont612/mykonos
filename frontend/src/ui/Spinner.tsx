import { cn } from './cn';

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      className={cn('ui-spinner ui-spinner-track', size === 'sm' ? 'h-4 w-4' : 'h-5 w-5', className)}
      aria-hidden="true"
    />
  );
}
