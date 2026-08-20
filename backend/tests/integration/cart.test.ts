import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';

const app = createApp();

async function setup() {
  const sellerRes = await request(app).post('/api/auth/register').send({
    email: 'seller@example.com', password: 'secret123', name: 'S', role: 'SELLER',
  });
  const buyerRes = await request(app).post('/api/auth/register').send({
    email: 'buyer@example.com', password: 'secret123', name: 'B', role: 'BUYER',
  });
  const productRes = await request(app).post('/api/products').set('Authorization', `Bearer ${sellerRes.body.accessToken}`).send({
    name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 50, category: 'tools',
  });
  return { buyerToken: buyerRes.body.accessToken, productId: productRes.body.id };
}

describe('Cart', () => {
  beforeEach(resetDb);

  it('adds an item and lists it with its current price', async () => {
    const { buyerToken, productId } = await setup();
    const addRes = await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 2 });
    expect(addRes.status).toBe(201);

    const listRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${buyerToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0]).toMatchObject({ productId, quantity: 2, priceCents: 900 });
  });

  it('increments quantity when adding the same product twice', async () => {
    const { buyerToken, productId } = await setup();
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 1 });
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 2 });
    const listRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${buyerToken}`);
    expect(listRes.body[0].quantity).toBe(3);
  });

  it('updates quantity and removes an item', async () => {
    const { buyerToken, productId } = await setup();
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 1 });

    const updateRes = await request(app).patch(`/api/cart/items/${productId}`).set('Authorization', `Bearer ${buyerToken}`).send({ quantity: 5 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.quantity).toBe(5);

    const delRes = await request(app).delete(`/api/cart/items/${productId}`).set('Authorization', `Bearer ${buyerToken}`);
    expect(delRes.status).toBe(204);

    const listRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${buyerToken}`);
    expect(listRes.body).toHaveLength(0);
  });
});
