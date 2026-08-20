import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/authMiddleware.js';
import { addCartItemSchema, updateCartItemSchema } from './cart.schemas.js';
import { getCart, addCartItem, updateCartItem, removeCartItem } from './cart.service.js';

export const cartRouter = Router();
cartRouter.use(requireAuth, requireRole('BUYER'));

cartRouter.get('/', async (req, res, next) => {
  try {
    res.json(await getCart(req.user!.id));
  } catch (err) {
    next(err);
  }
});

cartRouter.post('/items', async (req, res, next) => {
  try {
    const input = addCartItemSchema.parse(req.body);
    await addCartItem(req.user!.id, input.productId, input.quantity);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

cartRouter.patch('/items/:productId', async (req, res, next) => {
  try {
    const input = updateCartItemSchema.parse(req.body);
    const item = await updateCartItem(req.user!.id, req.params.productId, input.quantity);
    res.json({ productId: item.productId, quantity: item.quantity });
  } catch (err) {
    next(err);
  }
});

cartRouter.delete('/items/:productId', async (req, res, next) => {
  try {
    await removeCartItem(req.user!.id, req.params.productId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
