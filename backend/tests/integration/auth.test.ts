import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';

const app = createApp();

describe('POST /api/auth/register', () => {
  beforeEach(resetDb);

  it('creates a user and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'buyer@example.com',
      password: 'secret123',
      name: 'Ana Buyer',
      role: 'BUYER',
    });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user).toMatchObject({ email: 'buyer@example.com', role: 'BUYER' });
  });

  it('rejects duplicate emails with 409', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'dup@example.com', password: 'secret123', name: 'A', role: 'BUYER',
    });
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@example.com', password: 'secret123', name: 'B', role: 'SELLER',
    });
    expect(res.status).toBe(409);
  });

  it('rejects invalid input with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('handles concurrent registration with same email (race condition)', async () => {
    const registerPayload = {
      email: 'race@example.com',
      password: 'secret123',
      name: 'Race Tester',
      role: 'BUYER' as const,
    };

    const results = await Promise.all([
      request(app).post('/api/auth/register').send(registerPayload),
      request(app).post('/api/auth/register').send(registerPayload),
    ]);

    const statuses = results.map(r => r.status).sort();
    expect(statuses).toEqual([201, 409]);

    const successResult = results.find(r => r.status === 201);
    expect(successResult?.body.accessToken).toBeDefined();
    expect(successResult?.body.refreshToken).toBeDefined();

    const failResult = results.find(r => r.status === 409);
    expect(failResult?.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(resetDb);

  it('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'seller@example.com', password: 'secret123', name: 'S', role: 'SELLER',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'seller@example.com', password: 'secret123',
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'seller2@example.com', password: 'secret123', name: 'S', role: 'SELLER',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'seller2@example.com', password: 'wrong',
    });
    expect(res.status).toBe(401);
  });
});
