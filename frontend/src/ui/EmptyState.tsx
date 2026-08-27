import type { ReactNode } from 'react';
import { Card } from './Card';

export function EmptyState({
  icon,
  title,
  action,
}: {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      {icon && (
        <div className="grid h-11 w-11 place-items-center rounded-sm bg-surface-2 text-muted">{icon}</div>
      )}
      <p className="text-sm text-muted">{title}</p>
      {action}
    </Card>
  );
}
