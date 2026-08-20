import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  basePriceCents: z.number().int().positive(),
  initialStock: z.number().int().nonnegative(),
  category: z.string().min(1),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  basePriceCents: z.number().int().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  category: z.string().min(1).optional(),
});

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sellerId: z.string().optional(),
});
