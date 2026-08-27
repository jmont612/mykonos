export function stockBadge(stock: number): {
  variant: 'success' | 'warning' | 'danger';
  label: string;
} {
  if (stock <= 0) return { variant: 'danger', label: 'Agotado' };
  if (stock <= 3) return { variant: 'warning', label: `Quedan ${stock}` };
  return { variant: 'success', label: `Stock ${stock}` };
}
