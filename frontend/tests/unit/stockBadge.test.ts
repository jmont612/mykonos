import { describe, it, expect } from 'vitest';
import { stockBadge } from '../../src/shared/stockBadge';

describe('stockBadge', () => {
  it('returns danger / "Agotado" when stock is 0', () => {
    expect(stockBadge(0)).toEqual({ variant: 'danger', label: 'Agotado' });
  });

  it('returns warning / "Quedan N" for 1..3', () => {
    expect(stockBadge(1)).toEqual({ variant: 'warning', label: 'Quedan 1' });
    expect(stockBadge(3)).toEqual({ variant: 'warning', label: 'Quedan 3' });
  });

  it('returns success / "Stock N" for 4+', () => {
    expect(stockBadge(4)).toEqual({ variant: 'success', label: 'Stock 4' });
    expect(stockBadge(55)).toEqual({ variant: 'success', label: 'Stock 55' });
  });
});
