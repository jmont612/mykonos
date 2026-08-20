import { z } from 'zod';

export const updateSuborderStatusSchema = z.object({
  status: z.enum(['PAID', 'SHIPPED', 'CANCELLED']),
});
