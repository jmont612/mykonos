import { Router } from 'express';
import { requireAuth, requireRole } from '../../shared/authMiddleware.js';
import { createProductSchema, updateProductSchema, listProductsQuerySchema } from './products.schemas.js';
import { createProduct, listProducts, getProductById, updateProduct, deleteProduct } from './products.service.js';

export const productsRouter = Router();

productsRouter.post('/', requireAuth, requireRole('SELLER'), async (req, res, next) => {
  try {
    const input = createProductSchema.parse(req.body);
    const product = await createProduct(req.user!.id, input);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/', async (req, res, next) => {
  try {
    const query = listProductsQuerySchema.parse(req.query);
    const products = await listProducts(query);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.patch('/:id', requireAuth, requireRole('SELLER'), async (req, res, next) => {
  try {
    const input = updateProductSchema.parse(req.body);
    const product = await updateProduct(req.params.id, req.user!.id, input);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

productsRouter.delete('/:id', requireAuth, requireRole('SELLER'), async (req, res, next) => {
  try {
    await deleteProduct(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
