import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';

const app = createApp();

async function registerSeller() {
  const res = await request(app).post('/api/auth/register').send({
    email: 'seller@example.com', password: 'secret123', name: 'Seller', role: 'SELLER',
  });
  return res.body.accessToken as string;
}

async function registerBuyer() {
  const res = await request(app).post('/api/auth/register').send({
    email: 'buyer@example.com', password: 'secret123', name: 'Buyer', role: 'BUYER',
  });
  return res.body.accessToken as string;
}

describe('Products', () => {
  beforeEach(resetDb);

  it('lets a SELLER create a product', async () => {
    const token = await registerSeller();
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
      name: 'Widget', description: 'A widget', basePriceCents: 1999, initialStock: 50, category: 'tools',
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Widget');
    expect(typeof res.body.priceCents).toBe('number');
  });

  it('rejects product creation from a BUYER with 403', async () => {
    const token = await registerBuyer();
    const res = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
      name: 'Widget', description: 'A widget', basePriceCents: 1999, initialStock: 50, category: 'tools',
    });
    expect(res.status).toBe(403);
  });

  it('lists products publicly, filtered by category', async () => {
    const token = await registerSeller();
    await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
      name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 10, category: 'tools',
    });
    await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
      name: 'Gadget', description: 'd', basePriceCents: 2000, initialStock: 10, category: 'electronics',
    });
    const res = await request(app).get('/api/products?category=tools');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Widget');
  });

  it('lets the owner update stock, and rejects a non-owner with 403', async () => {
    const ownerToken = await registerSeller();
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${ownerToken}`).send({
      name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 10, category: 'tools',
    });
    const productId = createRes.body.id;

    const okRes = await request(app).patch(`/api/products/${productId}`).set('Authorization', `Bearer ${ownerToken}`).send({ stock: 5 });
    expect(okRes.status).toBe(200);
    expect(okRes.body.stock).toBe(5);

    const otherSellerRes = await request(app).post('/api/auth/register').send({
      email: 'other-seller@example.com', password: 'secret123', name: 'Other', role: 'SELLER',
    });
    const forbiddenRes = await request(app)
      .patch(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${otherSellerRes.body.accessToken}`)
      .send({ stock: 999 });
    expect(forbiddenRes.status).toBe(403);
  });

  it('lets the owner delete their product', async () => {
    const token = await registerSeller();
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
      name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 10, category: 'tools',
    });
    const delRes = await request(app).delete(`/api/products/${createRes.body.id}`).set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(204);
    const getRes = await request(app).get(`/api/products/${createRes.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it('rejects deleting a product that is referenced by a cart item with a clean 409 instead of a 500', async () => {
    const sellerToken = await registerSeller();
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${sellerToken}`).send({
      name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 10, category: 'tools',
    });
    const productId = createRes.body.id;

    const buyerToken = await registerBuyer();
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 1 });

    const delRes = await request(app).delete(`/api/products/${productId}`).set('Authorization', `Bearer ${sellerToken}`);
    expect(delRes.status).toBe(409);
    expect(delRes.body.error).toContain('Cannot delete a product with existing orders or cart items');

    const getRes = await request(app).get(`/api/products/${productId}`);
    expect(getRes.status).toBe(200);
  });

  it('rejects deleting a product that has been ordered with a clean 409 instead of a 500', async () => {
    const sellerToken = await registerSeller();
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${sellerToken}`).send({
      name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 10, category: 'tools',
    });
    const productId = createRes.body.id;

    const buyerToken = await registerBuyer();
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 1 });
    const checkoutRes = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`);
    expect(checkoutRes.status).toBe(201);

    const delRes = await request(app).delete(`/api/products/${productId}`).set('Authorization', `Bearer ${sellerToken}`);
    expect(delRes.status).toBe(409);
    expect(delRes.body.error).toContain('Cannot delete a product with existing orders or cart items');
  });
});
