import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';

const app = createApp();

async function fullCheckoutFlow() {
  const sellerRes = await request(app).post('/api/auth/register').send({ email: 'seller@example.com', password: 'secret123', name: 'S', role: 'SELLER' });
  const buyerRes = await request(app).post('/api/auth/register').send({ email: 'buyer@example.com', password: 'secret123', name: 'B', role: 'BUYER' });
  const sellerToken = sellerRes.body.accessToken;
  const buyerToken = buyerRes.body.accessToken;

  const productRes = await request(app).post('/api/products').set('Authorization', `Bearer ${sellerToken}`).send({
    name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 10, category: 'tools',
  });
  await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId: productRes.body.id, quantity: 1 });
  const checkoutRes = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`);

  return { sellerToken, buyerToken, order: checkoutRes.body };
}

describe('Order history', () => {
  beforeEach(resetDb);

  it('lets the buyer list and view their orders', async () => {
    const { buyerToken, order } = await fullCheckoutFlow();
    const listRes = await request(app).get('/api/orders').set('Authorization', `Bearer ${buyerToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const detailRes = await request(app).get(`/api/orders/${order.id}`).set('Authorization', `Bearer ${buyerToken}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.suborders).toHaveLength(1);
  });

  it('rejects viewing another buyer\'s order with 403', async () => {
    const { order } = await fullCheckoutFlow();
    const otherBuyerRes = await request(app).post('/api/auth/register').send({ email: 'other-buyer@example.com', password: 'secret123', name: 'O', role: 'BUYER' });
    const res = await request(app).get(`/api/orders/${order.id}`).set('Authorization', `Bearer ${otherBuyerRes.body.accessToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Seller suborders', () => {
  beforeEach(resetDb);

  it('lets the seller list and update their suborders', async () => {
    const { sellerToken, order } = await fullCheckoutFlow();
    const listRes = await request(app).get('/api/seller/suborders').set('Authorization', `Bearer ${sellerToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const suborderId = listRes.body[0].id;
    const updateRes = await request(app).patch(`/api/seller/suborders/${suborderId}`).set('Authorization', `Bearer ${sellerToken}`).send({ status: 'SHIPPED' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('SHIPPED');
  });

  it('rejects updating another seller\'s suborder with 403', async () => {
    const { order } = await fullCheckoutFlow();
    const otherSellerRes = await request(app).post('/api/auth/register').send({ email: 'other-seller@example.com', password: 'secret123', name: 'O', role: 'SELLER' });
    const suborderId = order.suborders[0].id;
    const res = await request(app).patch(`/api/seller/suborders/${suborderId}`).set('Authorization', `Bearer ${otherSellerRes.body.accessToken}`).send({ status: 'SHIPPED' });
    expect(res.status).toBe(403);
  });
});
