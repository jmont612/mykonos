import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/jwt.js';
import { UnauthorizedError, ForbiddenError } from './errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'BUYER' | 'SELLER' };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing token'));
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function requireRole(role: 'BUYER' | 'SELLER') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      next(new ForbiddenError(`Requires ${role} role`));
      return;
    }
    next();
  };
}
