import express from 'express';
import cors from 'cors';
import path from 'path';
import { ZodError } from 'zod';
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { sellerOrdersRouter } from './modules/orders/sellerOrders.routes.js';
import { errorHandler } from './shared/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/seller/suborders', sellerOrdersRouter);

  app.use((err: unknown, _req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Invalid input', details: err.issues });
      return;
    }
    next(err);
  });

  app.use(errorHandler);

  return app;
}
