import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../src/modules/auth/password.js';

describe('password utils', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('correct-horse');
    expect(hash).not.toBe('correct-horse');
    expect(await comparePassword('correct-horse', hash)).toBe(true);
    expect(await comparePassword('wrong-password', hash)).toBe(false);
  });
});
