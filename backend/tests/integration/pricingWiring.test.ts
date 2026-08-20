import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';

const app = createApp();

describe('Dynamic pricing wiring', () => {
  beforeEach(resetDb);

  it('raises the price as stock is depleted', async () => {
    const sellerRes = await request(app).post('/api/auth/register').send({
      email: 'seller@example.com', password: 'secret123', name: 'S', role: 'SELLER',
    });
    const token = sellerRes.body.accessToken;
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
      name: 'Widget', description: 'd', basePriceCents: 1000, initialStock: 50, category: 'tools',
    });
    expect(createRes.body.priceCents).toBe(900); // full stock, no sales -> 1000 * 1.0 * 0.9

    await request(app).patch(`/api/products/${createRes.body.id}`).set('Authorization', `Bearer ${token}`).send({ stock: 0 });
    const getRes = await request(app).get(`/api/products/${createRes.body.id}`);
    expect(getRes.body.priceCents).toBe(1350); // zero stock -> 1000 * 1.5 * 0.9
  });

  it('keeps a shipped sale counting toward the demand factor (price does not drop after the seller ships)', async () => {
    const sellerRes = await request(app).post('/api/auth/register').send({
      email: 'seller2@example.com', password: 'secret123', name: 'S2', role: 'SELLER',
    });
    const sellerToken = sellerRes.body.accessToken;

    const buyerRes = await request(app).post('/api/auth/register').send({
      email: 'buyer2@example.com', password: 'secret123', name: 'B2', role: 'BUYER',
    });
    const buyerToken = buyerRes.body.accessToken;

    // Huge initialStock isolates the demand factor by making the inventory factor's contribution negligible.
    const createRes = await request(app).post('/api/products').set('Authorization', `Bearer ${sellerToken}`).send({
      name: 'Gizmo', description: 'd', basePriceCents: 1000, initialStock: 1_000_000, category: 'tools',
    });
    const productId = createRes.body.id;

    const beforeRes = await request(app).get(`/api/products/${productId}`);
    expect(beforeRes.body.priceCents).toBe(900); // 1000 * 1.0 * 0.9, no sales yet

    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 1 });
    const checkoutRes = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`);
    expect(checkoutRes.status).toBe(201);
    const suborderId = checkoutRes.body.suborders[0].id;

    const afterCheckoutRes = await request(app).get(`/api/products/${productId}`);
    expect(afterCheckoutRes.body.priceCents).toBe(980); // 1000 * ~1.0 * 0.98, demand factor bumped by the recent sale

    const shipRes = await request(app)
      .patch(`/api/seller/suborders/${suborderId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'SHIPPED' });
    expect(shipRes.status).toBe(200);
    expect(shipRes.body.status).toBe('SHIPPED');

    const afterShipRes = await request(app).get(`/api/products/${productId}`);
    // Must stay at 980, not fall back to 900 — shipping isn't a cancellation, the sale still counts.
    expect(afterShipRes.body.priceCents).toBe(980);
  });
});
