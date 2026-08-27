import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  apiRequest,
  ApiError,
  setAccessToken,
  setRefreshHandler,
  setUnauthorizedHandler,
} from '../../src/api/client';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  beforeEach(() => {
    setAccessToken(null);
    setRefreshHandler(async () => {
      throw new Error('no refresh handler configured for this test');
    });
    setUnauthorizedHandler(() => {});
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));
    const result = await apiRequest<{ ok: boolean }>('/api/health');
    expect(result).toEqual({ ok: true });
  });

  it('sends the Authorization header when auth is true and a token is set', async () => {
    setAccessToken('token-123');
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));
    await apiRequest('/api/cart', { auth: true });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
  });

  it('throws ApiError with the backend message on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'Invalid credentials' }, 401));
    setRefreshHandler(async () => {
      throw new Error('refresh should not be attempted for a non-auth request');
    });
    await expect(apiRequest('/api/auth/login', { method: 'POST' })).rejects.toMatchObject({
      message: 'Invalid credentials',
      status: 401,
    });
  });

  it('treats a 204 response as undefined', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const result = await apiRequest('/api/cart/items/p1', { method: 'DELETE', auth: true });
    expect(result).toBeUndefined();
  });

  it('on a 401 for an auth request, refreshes once and retries', async () => {
    setAccessToken('expired-token');
    setRefreshHandler(async () => {
      setAccessToken('fresh-token');
      return 'fresh-token';
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ error: 'Invalid or expired token' }, 401))
      .mockResolvedValueOnce(jsonResponse({ id: 'u1' }));

    const result = await apiRequest('/api/auth/me', { auth: true });

    expect(result).toEqual({ id: 'u1' });
    expect(fetch).toHaveBeenCalledTimes(2);
    const [, secondInit] = vi.mocked(fetch).mock.calls[1];
    expect((secondInit!.headers as Record<string, string>).Authorization).toBe('Bearer fresh-token');
  });

  it('sends a FormData body as-is without setting Content-Type', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ ok: true }));
    const formData = new FormData();
    formData.append('images', new File(['x'], 'a.png', { type: 'image/png' }));

    await apiRequest('/api/products/p1/images', { method: 'POST', auth: true, body: formData });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init!.body).toBe(formData);
    expect((init!.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('calls the unauthorized handler and throws if the refresh itself fails', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    setRefreshHandler(async () => {
      throw new Error('refresh token expired');
    });
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'Invalid or expired token' }, 401));

    await expect(apiRequest('/api/auth/me', { auth: true })).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
