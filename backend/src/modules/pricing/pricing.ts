export const DEMAND_THRESHOLD = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateInventoryFactor(stock: number, initialStock: number): number {
  if (initialStock <= 0) return 1.0;
  const ratio = stock / initialStock;
  return clamp(1 + (1 - ratio) * 0.5, 1.0, 1.5);
}

export function calculateDemandFactor(recentSalesCount: number, threshold: number = DEMAND_THRESHOLD): number {
  return clamp(0.9 + (recentSalesCount / threshold) * 0.4, 0.9, 1.3);
}

export function calculatePrice(
  basePriceCents: number,
  stock: number,
  initialStock: number,
  recentSalesCount: number,
): number {
  const inventoryFactor = calculateInventoryFactor(stock, initialStock);
  const demandFactor = calculateDemandFactor(recentSalesCount);
  return Math.round(basePriceCents * inventoryFactor * demandFactor);
}
