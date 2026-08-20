import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../../src/shared/errorHandler.js';
import { NotFoundError } from '../../src/shared/errors.js';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('maps an AppError subclass to its statusCode and message', () => {
    const res = mockRes();
    errorHandler(new NotFoundError('Product not found'), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  });

  it('maps an unknown error to 500 without leaking details', () => {
    const res = mockRes();
    errorHandler(new Error('db connection string leaked'), {} as any, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
