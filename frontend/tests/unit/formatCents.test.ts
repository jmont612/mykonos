import { describe, it, expect } from 'vitest';
import { formatCents } from '../../src/shared/formatCents';

describe('formatCents', () => {
  it('formats whole dollars', () => {
    expect(formatCents(1000)).toBe('$10.00');
  });

  it('formats cents with padding', () => {
    expect(formatCents(105)).toBe('$1.05');
  });

  it('formats zero', () => {
    expect(formatCents(0)).toBe('$0.00');
  });

  it('adds a thousands separator', () => {
    expect(formatCents(1234567)).toBe('$12,345.67');
  });
});
