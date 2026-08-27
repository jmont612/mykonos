import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';

const app = createApp();

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const PNG_BUFFER = Buffer.from(PNG_BASE64, 'base64');

async function registerSeller(email = 'seller@example.com') {
  const res = await request(app).post('/api/auth/register').send({
    email, password: 'secret123', name: 'Seller', role: 'SELLER',
  });
  return res.body.accessToken as string;
}

async function createProduct(token: string) {
  const res = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
    name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 10, category: 'tools',
  });
  return res.body.id as string;
}

describe('Product images', () => {
  beforeEach(resetDb);

  it('uploads an image and marks the first one primary', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].isPrimary).toBe(true);
    expect(res.body[0].url).toContain(`/uploads/products/${productId}/`);
  });

  it('does not mark a second uploaded image as primary', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'a.png', contentType: 'image/png' });

    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'b.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body[0].isPrimary).toBe(false);
  });

  it('rejects a non-image file with 400', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('not an image'), { filename: 'notes.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
  });

  it('rejects a file larger than 5MB with 400', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', bigBuffer, { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
  });

  it('rejects uploading a 6th image with 409', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/products/${productId}/images`)
        .set('Authorization', `Bearer ${token}`)
        .attach('images', PNG_BUFFER, { filename: `${i}.png`, contentType: 'image/png' });
    }

    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'sixth.png', contentType: 'image/png' });

    expect(res.status).toBe(409);
  });

  it('rejects a single request attaching more than 5 files with 400', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    let req = request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`);
    for (let i = 0; i < 6; i++) {
      req = req.attach('images', PNG_BUFFER, { filename: `${i}.png`, contentType: 'image/png' });
    }
    const res = await req;

    expect(res.status).toBe(400);
  });

  it('writes nothing to disk when an upload is rejected for exceeding the 5-image cap', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/products/${productId}/images`)
        .set('Authorization', `Bearer ${token}`)
        .attach('images', PNG_BUFFER, { filename: `${i}.png`, contentType: 'image/png' });
    }

    const productDir = path.resolve(process.cwd(), 'uploads', 'products', productId);
    const filesBefore = await readdir(productDir);
    expect(filesBefore).toHaveLength(5);

    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'sixth.png', contentType: 'image/png' });
    expect(res.status).toBe(409);

    const filesAfter = await readdir(productDir);
    expect(filesAfter).toHaveLength(5);
    expect(filesAfter.sort()).toEqual(filesBefore.sort());
  });

  it('rejects upload from a non-owner with 403', async () => {
    const ownerToken = await registerSeller('owner@example.com');
    const productId = await createProduct(ownerToken);
    const otherToken = await registerSeller('other@example.com');

    const res = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${otherToken}`)
      .attach('images', PNG_BUFFER, { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(403);
  });

  it('deletes an image and promotes the next one to primary if the primary was deleted', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    const first = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'a.png', contentType: 'image/png' });
    const second = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'b.png', contentType: 'image/png' });

    const firstImageId = first.body[0].id;
    const secondImageId = second.body[0].id;

    const delRes = await request(app)
      .delete(`/api/products/${productId}/images/${firstImageId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(204);

    const getRes = await request(app).get(`/api/products/${productId}`);
    const remaining = getRes.body.images.find((img: { id: string }) => img.id === secondImageId);
    expect(remaining.isPrimary).toBe(true);
  });

  it('sets a different image as primary, unsetting the previous one', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    const first = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'a.png', contentType: 'image/png' });
    const second = await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'b.png', contentType: 'image/png' });

    const firstImageId = first.body[0].id;
    const secondImageId = second.body[0].id;

    const res = await request(app)
      .patch(`/api/products/${productId}/images/${secondImageId}/primary`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isPrimary).toBe(true);

    const getRes = await request(app).get(`/api/products/${productId}`);
    const firstImage = getRes.body.images.find((img: { id: string }) => img.id === firstImageId);
    expect(firstImage.isPrimary).toBe(false);
  });

  it('removes the product image directory when the product is deleted', async () => {
    const token = await registerSeller();
    const productId = await createProduct(token);

    await request(app)
      .post(`/api/products/${productId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', PNG_BUFFER, { filename: 'a.png', contentType: 'image/png' });

    const dir = path.resolve(process.cwd(), 'uploads', 'products', productId);
    expect(existsSync(dir)).toBe(true);

    const delRes = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(204);

    expect(existsSync(dir)).toBe(false);
  });
});
