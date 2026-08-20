import { describe, it, expect } from 'vitest';
import { calculateInventoryFactor, calculateDemandFactor, calculatePrice } from '../../src/modules/pricing/pricing.js';

describe('calculateInventoryFactor', () => {
  it('is 1.0 at full stock', () => {
    expect(calculateInventoryFactor(50, 50)).toBeCloseTo(1.0);
  });
  it('is 1.5 at zero stock', () => {
    expect(calculateInventoryFactor(0, 50)).toBeCloseTo(1.5);
  });
  it('is 1.25 at half stock', () => {
    expect(calculateInventoryFactor(25, 50)).toBeCloseTo(1.25);
  });
});

describe('calculateDemandFactor', () => {
  it('is 0.9 with zero recent sales', () => {
    expect(calculateDemandFactor(0, 5)).toBeCloseTo(0.9);
  });
  it('clamps at 1.3 above the threshold', () => {
    expect(calculateDemandFactor(50, 5)).toBeCloseTo(1.3);
  });
  it('scales linearly below the threshold', () => {
    // formula: 0.9 + (sales/threshold)*0.4, clamped [0.9,1.3] -> 0.9 + (2/5)*0.4 = 1.06
    expect(calculateDemandFactor(2, 5)).toBeCloseTo(1.06);
  });
});

describe('calculatePrice', () => {
  it('combines both factors, rounded to the nearest cent', () => {
    // basePrice 1000, full stock (factor 1.0), zero recent sales (factor 0.9)
    expect(calculatePrice(1000, 50, 50, 0)).toBe(900);
  });
  it('applies both factors together at low stock and high demand', () => {
    // stock 0/50 -> inventory 1.5; sales 10 clamps demand to 1.3; 1000 * 1.5 * 1.3 = 1950
    expect(calculatePrice(1000, 0, 50, 10)).toBe(1950);
  });
});
