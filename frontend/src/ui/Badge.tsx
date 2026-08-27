import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ variant = 'neutral', className, ...rest }: BadgeProps) {
  return <span className={cn('badge', variant !== 'neutral' && `badge-${variant}`, className)} {...rest} />;
}
