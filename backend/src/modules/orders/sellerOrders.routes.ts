import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/authMiddleware.js';
import { updateSuborderStatusSchema } from './sellerOrders.schemas.js';
import { listSellerSuborders, updateSuborderStatus } from './orders.service.js';

export const sellerOrdersRouter = Router();
sellerOrdersRouter.use(requireAuth, requireRole('SELLER'));

sellerOrdersRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listSellerSuborders(req.user!.id));
  } catch (err) {
    next(err);
  }
});

sellerOrdersRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = updateSuborderStatusSchema.parse(req.body);
    const suborder = await updateSuborderStatus(req.user!.id, req.params.id, input.status);
    res.json(suborder);
  } catch (err) {
    next(err);
  }
});
