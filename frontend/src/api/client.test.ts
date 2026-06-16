import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { get, post, ApiError } from './client';

const server = setupServer(
  http.get('*/test', () => HttpResponse.json({ ok: true })),
  http.get('*/error', () => new HttpResponse(null, { status: 500 })),
  http.post('*/echo', async ({ request }) => {
    const cloned = request.clone();
    const body = await cloned.json();
    return HttpResponse.json(body, { status: 201 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('apiClient', () => {
  it('get returns data', async () => {
    const data = await get<{ ok: boolean }>('/test');
    expect(data.ok).toBe(true);
  });

  it('throws ApiError on non-ok', async () => {
    await expect(get('/error')).rejects.toThrow(ApiError);
  });

  it('post sends body and returns data', async () => {
    const data = await post<{ message: string }>('/echo', { message: 'hello' });
    expect(data.message).toBe('hello');
  });
});
