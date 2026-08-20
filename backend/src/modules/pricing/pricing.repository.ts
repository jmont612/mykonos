import { prisma } from '../../shared/prismaClient.js';

export async function getRecentSalesCount(productId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.orderItem.count({
    where: {
      productId,
      suborder: { status: { not: 'CANCELLED' }, order: { createdAt: { gte: since } } },
    },
  });
}
