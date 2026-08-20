import { prisma } from '../../shared/prismaClient.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors.js';
import { getCalculatedPriceCents } from '../pricing/pricing.service.js';
import type { createProductSchema, updateProductSchema, listProductsQuerySchema } from './products.schemas.js';
import type { z } from 'zod';
import { Prisma } from '@prisma/client';

type CreateInput = z.infer<typeof createProductSchema>;
type UpdateInput = z.infer<typeof updateProductSchema>;
type ListQuery = z.infer<typeof listProductsQuerySchema>;

async function toResponse(product: { id: string; sellerId: string; name: string; description: string; basePriceCents: number; stock: number; initialStock: number; category: string }) {
  return {
    id: product.id,
    sellerId: product.sellerId,
    name: product.name,
    description: product.description,
    priceCents: await getCalculatedPriceCents(product),
    stock: product.stock,
    category: product.category,
  };
}

export async function createProduct(sellerId: string, input: CreateInput) {
  const product = await prisma.product.create({
    data: { ...input, stock: input.initialStock, sellerId },
  });
  return toResponse(product);
}

export async function listProducts(query: ListQuery) {
  const products = await prisma.product.findMany({
    where: {
      category: query.category,
      sellerId: query.sellerId,
      name: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
    },
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(products.map(toResponse));
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Product not found');
  return toResponse(product);
}

async function findOwnedProduct(id: string, sellerId: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Product not found');
  if (product.sellerId !== sellerId) throw new ForbiddenError('Not the owner of this product');
  return product;
}

export async function updateProduct(id: string, sellerId: string, input: UpdateInput) {
  await findOwnedProduct(id, sellerId);
  const updated = await prisma.product.update({ where: { id }, data: input });
  return toResponse(updated);
}

export async function deleteProduct(id: string, sellerId: string) {
  await findOwnedProduct(id, sellerId);
  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new ConflictError('Cannot delete a product with existing orders or cart items');
    }
    throw error;
  }
}
