import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cn('input cursor-pointer pr-8', className)} {...rest}>
      {children}
    </select>
  );
});
