import { prisma } from '../../src/shared/prismaClient.js';
import { rm } from 'fs/promises';
import path from 'path';

export async function resetDb() {
  await prisma.productImage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.suborder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await rm(path.resolve(process.cwd(), 'uploads'), { recursive: true, force: true });
}
