import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/modules/auth/jwt.js';

describe('jwt utils', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({ userId: 'u1', role: 'BUYER' });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe('u1');
    expect(payload.role).toBe('BUYER');
  });

  it('signs and verifies a refresh token', () => {
    const token = signRefreshToken({ userId: 'u2', role: 'SELLER' });
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe('u2');
    expect(payload.role).toBe('SELLER');
  });

  it('rejects an access token verified as a refresh token', () => {
    const token = signAccessToken({ userId: 'u1', role: 'BUYER' });
    expect(() => verifyRefreshToken(token)).toThrow();
  });
});
