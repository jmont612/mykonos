import { mkdir, rm, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const PRODUCTS_DIR = path.join(UPLOAD_ROOT, 'products');

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function saveProductImageFile(
  productId: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  const dir = path.join(PRODUCTS_DIR, productId);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}${EXTENSIONS[mimetype] ?? ''}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/products/${productId}/${filename}`;
}

export async function deleteProductImageFile(url: string): Promise<void> {
  const relative = url.replace(/^\/uploads\//, '');
  await unlink(path.join(UPLOAD_ROOT, relative)).catch(() => {});
}

export async function deleteProductImageDir(productId: string): Promise<void> {
  const dir = path.join(PRODUCTS_DIR, productId);
  await rm(dir, { recursive: true, force: true });
}
