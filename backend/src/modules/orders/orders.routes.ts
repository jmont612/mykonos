import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/authMiddleware.js';
import { checkout, listOrders, getOrderById } from './orders.service.js';

export const ordersRouter = Router();
ordersRouter.use(requireAuth, requireRole('BUYER'));

ordersRouter.post('/checkout', async (req, res, next) => {
  try {
    const order = await checkout(req.user!.id);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/', async (req, res, next) => {
  try {
    res.json(await listOrders(req.user!.id));
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    res.json(await getOrderById(req.user!.id, req.params.id));
  } catch (err) {
    next(err);
  }
});
