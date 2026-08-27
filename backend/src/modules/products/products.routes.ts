import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../../shared/authMiddleware.js';
import { createProductSchema, updateProductSchema, listProductsQuerySchema } from './products.schemas.js';
import { createProduct, listProducts, getProductById, updateProduct, deleteProduct } from './products.service.js';
import { addProductImages, deleteProductImage, setPrimaryProductImage } from './productImages.service.js';
import { uploadProductImages } from './upload.js';
import { AppError } from '../../shared/errors.js';

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

productsRouter.post('/:id/images', requireAuth, requireRole('SELLER'), (req, res, next) => {
  uploadProductImages(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
          ? 'Each image must be 5MB or smaller'
          : 'Invalid upload: too many files or malformed request';
        next(new AppError(message, 400));
        return;
      }
      if (err instanceof Error && err.message === 'INVALID_FILE_TYPE') {
        next(new AppError('Only JPG, PNG, and WebP images are allowed', 400));
        return;
      }
      next(err);
      return;
    }
    (async () => {
      try {
        const files = (req.files as Express.Multer.File[] | undefined) ?? [];
        const images = await addProductImages(req.params.id, req.user!.id, files);
        res.status(201).json(images.map((img) => ({ id: img.id, url: img.url, isPrimary: img.isPrimary })));
      } catch (err2) {
        next(err2);
      }
    })();
  });
});

productsRouter.delete('/:id/images/:imageId', requireAuth, requireRole('SELLER'), async (req, res, next) => {
  try {
    await deleteProductImage(req.params.id, req.user!.id, req.params.imageId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

productsRouter.patch('/:id/images/:imageId/primary', requireAuth, requireRole('SELLER'), async (req, res, next) => {
  try {
    const image = await setPrimaryProductImage(req.params.id, req.user!.id, req.params.imageId);
    res.json({ id: image.id, url: image.url, isPrimary: image.isPrimary });
  } catch (err) {
    next(err);
  }
});
