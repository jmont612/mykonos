import type { ReactNode } from 'react';
import { cn } from './cn';

export function Alert({
  variant = 'danger',
  children,
  className,
}: {
  variant?: 'danger' | 'success';
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role={variant === 'danger' ? 'alert' : 'status'} className={cn('alert', `alert-${variant}`, className)}>
      {children}
    </div>
  );
}
