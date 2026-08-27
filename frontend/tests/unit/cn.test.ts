import { describe, it, expect } from 'vitest';
import { cn } from '../../src/ui/cn';

describe('cn', () => {
  it('joins truthy class strings and drops falsy ones', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
