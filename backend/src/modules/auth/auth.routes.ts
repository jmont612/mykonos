import { Router } from 'express';
import { registerSchema, loginSchema } from './auth.schemas.js';
import { registerUser, loginUser, refreshAccessToken, getUserById } from './auth.service.js';
import { requireAuth } from '../../shared/authMiddleware.js';
import { UnauthorizedError } from '../../shared/errors.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    if (!req.body?.refreshToken) throw new UnauthorizedError('Missing refresh token');
    const result = await refreshAccessToken(req.body.refreshToken);
    res.json(result);
  } catch (err) {
    console.error(err);
    next(new UnauthorizedError('Invalid or expired refresh token'));
  }
});
