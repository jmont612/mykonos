import { prisma } from '../../shared/prismaClient.js';
import { getCalculatedPriceCents } from '../pricing/pricing.service.js';
import { InsufficientStockError, ConflictError, NotFoundError, ForbiddenError } from '../../shared/errors.js';

export async function checkout(buyerId: string) {
  const order = await prisma.$transaction(async (tx) => {
    const cartItems = await tx.cartItem.findMany({ where: { buyerId }, include: { product: true } });
    if (cartItems.length === 0) {
      throw new ConflictError('Cart is empty');
    }
    const cartItemIds = cartItems.map((ci) => ci.id);

    const priced = await Promise.all(
      cartItems.map(async (item) => ({
        item,
        unitPriceCents: await getCalculatedPriceCents(item.product),
      })),
    );

    for (const { item } of priced) {
      if (item.quantity > item.product.stock) {
        throw new InsufficientStockError(`Insufficient stock for product ${item.productId}`);
      }
    }

    const bySeller = new Map<string, typeof priced>();
    for (const p of priced) {
      const sellerId = p.item.product.sellerId;
      const list = bySeller.get(sellerId) ?? [];
      list.push(p);
      bySeller.set(sellerId, list);
    }

    const totalAmountCents = priced.reduce((sum, p) => sum + p.unitPriceCents * p.item.quantity, 0);

    const createdOrder = await tx.order.create({ data: { buyerId, totalAmountCents } });

    for (const [sellerId, items] of bySeller) {
      const subtotalCents = items.reduce((sum, p) => sum + p.unitPriceCents * p.item.quantity, 0);
      const suborder = await tx.suborder.create({
        data: { orderId: createdOrder.id, sellerId, subtotalCents, status: 'PAID' },
      });
      for (const { item, unitPriceCents } of items) {
        await tx.orderItem.create({
          data: {
            suborderId: suborder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPriceAtPurchaseCents: unitPriceCents,
          },
        });
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new InsufficientStockError(`Insufficient stock for product ${item.productId}`);
        }
      }
    }

    // Fewer rows deleted than expected means a concurrent checkout already consumed this cart.
    const deleted = await tx.cartItem.deleteMany({ where: { buyerId, id: { in: cartItemIds } } });
    if (deleted.count !== cartItemIds.length) {
      throw new ConflictError('Cart changed during checkout, please try again');
    }

    return tx.order.findUniqueOrThrow({
      where: { id: createdOrder.id },
      include: { suborders: { include: { orderItems: true } } },
    });
  });

  return order;
}

export async function listOrders(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    include: { suborders: { include: { orderItems: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(buyerId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { suborders: { include: { orderItems: true } } },
  });
  if (!order) throw new NotFoundError('Order not found');
  if (order.buyerId !== buyerId) throw new ForbiddenError('Not your order');
  return order;
}

export async function listSellerSuborders(sellerId: string) {
  return prisma.suborder.findMany({
    where: { sellerId },
    include: { orderItems: true },
  });
}

export async function updateSuborderStatus(sellerId: string, suborderId: string, status: 'PAID' | 'SHIPPED' | 'CANCELLED') {
  const suborder = await prisma.suborder.findUnique({ where: { id: suborderId } });
  if (!suborder) throw new NotFoundError('Suborder not found');
  if (suborder.sellerId !== sellerId) throw new ForbiddenError('Not your suborder');
  return prisma.suborder.update({ where: { id: suborderId }, data: { status } });
}
