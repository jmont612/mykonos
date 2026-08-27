import { prisma } from '../../shared/prismaClient.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { deleteProductImageFile, saveProductImageFile } from './imageStorage.js';

const MAX_IMAGES_PER_PRODUCT = 5;

async function findOwnedProduct(id: string, sellerId: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError('Product not found');
  if (product.sellerId !== sellerId) throw new ForbiddenError('Not the owner of this product');
  return product;
}

export async function addProductImages(
  productId: string,
  sellerId: string,
  files: Express.Multer.File[],
) {
  await findOwnedProduct(productId, sellerId);

  const existingCount = await prisma.productImage.count({ where: { productId } });
  if (existingCount + files.length > MAX_IMAGES_PER_PRODUCT) {
    throw new ConflictError(`A product can have at most ${MAX_IMAGES_PER_PRODUCT} images`);
  }

  const created = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const url = await saveProductImageFile(productId, file.buffer, file.mimetype);
    const image = await prisma.productImage.create({
      data: { productId, url, isPrimary: existingCount === 0 && i === 0 },
    });
    created.push(image);
  }
  return created;
}

export async function deleteProductImage(productId: string, sellerId: string, imageId: string) {
  await findOwnedProduct(productId, sellerId);
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw new NotFoundError('Image not found');

  await prisma.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await tx.productImage.findFirst({
        where: { productId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }
  });

  await deleteProductImageFile(image.url);
}

export async function setPrimaryProductImage(productId: string, sellerId: string, imageId: string) {
  await findOwnedProduct(productId, sellerId);
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw new NotFoundError('Image not found');

  return prisma.$transaction(async (tx) => {
    await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
    return tx.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
  });
}
