import { describe, it, expect } from 'vitest';
import { formatApiErrorDetails } from '../../src/shared/formatApiErrorDetails';
import { ApiError } from '../../src/api/client';

describe('formatApiErrorDetails', () => {
  it('joins Zod issue messages for a 400 with Zod-shaped details', () => {
    const error = new ApiError('Invalid input', 400, [
      { path: ['email'], message: 'Invalid email' },
      { path: ['password'], message: 'String must contain at least 6 character(s)' },
    ]);

    const result = formatApiErrorDetails(error);

    expect(result).toContain('Invalid email');
    expect(result).toContain('String must contain at least 6 character(s)');
  });

  it('falls back to the error message when there are no details', () => {
    const error = new ApiError('Invalid credentials', 401);

    expect(formatApiErrorDetails(error)).toBe('Invalid credentials');
  });

  it('falls back to the error message when details are not Zod-shaped', () => {
    const error = new ApiError('Something went wrong', 400, { unexpected: 'shape' });

    expect(formatApiErrorDetails(error)).toBe('Something went wrong');
  });
});
