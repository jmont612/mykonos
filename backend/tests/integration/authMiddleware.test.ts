import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { resetDb } from '../helpers/resetDb.js';

const app = createApp();

async function registerAndGetTokens(role: 'BUYER' | 'SELLER' = 'BUYER') {
  const res = await request(app).post('/api/auth/register').send({
    email: `auth${role.toLowerCase()}@test.com`, password: 'secret123', name: 'Test', role,
  });
  return res.body as { accessToken: string; refreshToken: string; user: { id: string } };
}

describe('GET /api/auth/me', () => {
  beforeEach(resetDb);

  it('returns the current user with a valid token', async () => {
    const { accessToken, user } = await registerAndGetTokens();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(resetDb);

  it('issues a new access token from a valid refresh token', async () => {
    const { refreshToken } = await registerAndGetTokens();
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});
