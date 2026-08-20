import { prisma } from '../../src/shared/prismaClient.js';

export async function resetDb() {
  await prisma.orderItem.deleteMany();
  await prisma.suborder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}
