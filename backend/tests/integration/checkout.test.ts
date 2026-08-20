import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';
import { prisma } from '../../src/shared/prismaClient.js';

const app = createApp();

async function registerSeller(email: string) {
  const res = await request(app).post('/api/auth/register').send({ email, password: 'secret123', name: 'Seller', role: 'SELLER' });
  return res.body.accessToken as string;
}

async function registerBuyer() {
  const res = await request(app).post('/api/auth/register').send({ email: 'buyer@example.com', password: 'secret123', name: 'Buyer', role: 'BUYER' });
  return res.body.accessToken as string;
}

async function createProduct(token: string, overrides: Partial<{ basePriceCents: number; initialStock: number }> = {}) {
  const res = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({
    name: 'Widget', description: 'd', basePriceCents: overrides.basePriceCents ?? 1000, initialStock: overrides.initialStock ?? 10, category: 'tools',
  });
  return res.body.id as string;
}

describe('POST /api/orders/checkout', () => {
  beforeEach(resetDb);

  it('splits a cart with two sellers into two suborders, freezes price, and decrements stock', async () => {
    const sellerAToken = await registerSeller('sellerA@example.com');
    const sellerBToken = await registerSeller('sellerB@example.com');
    const buyerToken = await registerBuyer();

    const productA = await createProduct(sellerAToken, { basePriceCents: 1000, initialStock: 10 });
    const productB = await createProduct(sellerBToken, { basePriceCents: 2000, initialStock: 10 });

    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId: productA, quantity: 2 });
    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId: productB, quantity: 1 });

    const res = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(201);
    expect(res.body.suborders).toHaveLength(2);

    expect(res.body.totalAmountCents).toBe(3600);

    const suborderA = res.body.suborders.find((s: any) => s.orderItems.some((oi: any) => oi.productId === productA));
    const suborderB = res.body.suborders.find((s: any) => s.orderItems.some((oi: any) => oi.productId === productB));

    expect(suborderA).toBeDefined();
    expect(suborderB).toBeDefined();
    expect(suborderA.sellerId).not.toBe(suborderB.sellerId);

    expect(suborderA.orderItems[0].unitPriceAtPurchaseCents).toBe(900);
    expect(suborderA.subtotalCents).toBe(1800);

    expect(suborderB.orderItems[0].unitPriceAtPurchaseCents).toBe(1800);
    expect(suborderB.subtotalCents).toBe(1800);

    const productAAfter = await request(app).get(`/api/products/${productA}`);
    expect(productAAfter.body.stock).toBe(8);

    const productBAfter = await request(app).get(`/api/products/${productB}`);
    expect(productBAfter.body.stock).toBe(9);

    const cartAfter = await request(app).get('/api/cart').set('Authorization', `Bearer ${buyerToken}`);
    expect(cartAfter.body).toHaveLength(0);
  });

  it('rolls back entirely when one item has insufficient stock', async () => {
    const sellerToken = await registerSeller('seller@example.com');
    const buyerToken = await registerBuyer();
    const productId = await createProduct(sellerToken, { basePriceCents: 1000, initialStock: 1 });

    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 5 });

    const res = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Insufficient stock');

    const productAfter = await request(app).get(`/api/products/${productId}`);
    expect(productAfter.body.stock).toBe(1);

    const orderCount = await prisma.order.count();
    expect(orderCount).toBe(0);
  });

  it('rejects checkout with an empty cart', async () => {
    const buyerToken = await registerBuyer();
    const res = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Cart is empty');
  });

  it('is idempotent under concurrent double-submission: only one of two simultaneous checkouts succeeds', async () => {
    const sellerToken = await registerSeller('seller@example.com');
    const buyerToken = await registerBuyer();
    const productId = await createProduct(sellerToken, { basePriceCents: 1000, initialStock: 100 });

    await request(app).post('/api/cart/items').set('Authorization', `Bearer ${buyerToken}`).send({ productId, quantity: 1 });

    const [resA, resB] = await Promise.all([
      request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`),
      request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${buyerToken}`),
    ]);

    const statuses = [resA.status, resB.status];
    const successCount = statuses.filter((s) => s === 201).length;
    const failureCount = statuses.filter((s) => s >= 400 && s < 500).length;
    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    const orderCount = await prisma.order.count();
    expect(orderCount).toBe(1);

    const productAfter = await request(app).get(`/api/products/${productId}`);
    expect(productAfter.body.stock).toBe(99);
  });
});
