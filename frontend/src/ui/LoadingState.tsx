import { Spinner } from './Spinner';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-6 text-sm text-muted" role="status">
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  );
}
