import { calculatePrice } from './pricing.js';
import { getRecentSalesCount } from './pricing.repository.js';

export async function getCalculatedPriceCents(product: {
  id: string;
  basePriceCents: number;
  stock: number;
  initialStock: number;
}): Promise<number> {
  const recentSalesCount = await getRecentSalesCount(product.id);
  return calculatePrice(product.basePriceCents, product.stock, product.initialStock, recentSalesCount);
}
