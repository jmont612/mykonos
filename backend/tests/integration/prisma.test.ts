import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../../src/shared/prismaClient.js';

describe('Prisma client', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('can create and read a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'smoke-test@example.com',
        passwordHash: 'x',
        name: 'Smoke Test',
        role: 'BUYER',
      },
    });
    const found = await prisma.user.findUnique({ where: { id: user.id } });
    expect(found?.email).toBe('smoke-test@example.com');
    await prisma.user.delete({ where: { id: user.id } });
  });
});
