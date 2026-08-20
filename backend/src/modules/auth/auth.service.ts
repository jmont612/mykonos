import { prisma } from '../../shared/prismaClient.js';
import { hashPassword, comparePassword } from './password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors.js';
import type { registerSchema, loginSchema } from './auth.schemas.js';
import type { z } from 'zod';
import { Prisma } from '@prisma/client';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

function toAuthResponse(user: { id: string; email: string; name: string; role: 'BUYER' | 'SELLER' }) {
  return {
    accessToken: signAccessToken({ userId: user.id, role: user.role }),
    refreshToken: signRefreshToken({ userId: user.id, role: user.role }),
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email already registered');

  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name, role: input.role },
    });
    return toAuthResponse(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Email already registered');
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  return toAuthResponse(user);
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken); // throws on invalid/expired
  return { accessToken: signAccessToken({ userId: payload.userId, role: payload.role }) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
