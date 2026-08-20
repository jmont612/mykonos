import { prisma } from '../../shared/prismaClient.js';
import { NotFoundError } from '../../shared/errors.js';
import { getCalculatedPriceCents } from '../pricing/pricing.service.js';

async function toResponse(item: { productId: string; quantity: number; product: { id: string; basePriceCents: number; stock: number; initialStock: number } }) {
  return {
    productId: item.productId,
    quantity: item.quantity,
    priceCents: await getCalculatedPriceCents(item.product),
  };
}

export async function getCart(buyerId: string) {
  const items = await prisma.cartItem.findMany({ where: { buyerId }, include: { product: true } });
  return Promise.all(items.map(toResponse));
}

export async function addCartItem(buyerId: string, productId: string, quantity: number) {
  const existing = await prisma.cartItem.findUnique({ where: { buyerId_productId: { buyerId, productId } } });
  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  }
  return prisma.cartItem.create({ data: { buyerId, productId, quantity } });
}

export async function updateCartItem(buyerId: string, productId: string, quantity: number) {
  const existing = await prisma.cartItem.findUnique({ where: { buyerId_productId: { buyerId, productId } } });
  if (!existing) throw new NotFoundError('Cart item not found');
  return prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
}

export async function removeCartItem(buyerId: string, productId: string) {
  const existing = await prisma.cartItem.findUnique({ where: { buyerId_productId: { buyerId, productId } } });
  if (!existing) throw new NotFoundError('Cart item not found');
  await prisma.cartItem.delete({ where: { id: existing.id } });
}
