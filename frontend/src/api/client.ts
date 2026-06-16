import { useUserStore } from '../stores/userStore';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API Error: ${status}`);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const email = useUserStore.getState().email;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (email) {
    headers['X-User-Email'] = email;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Dev-only request logging to help debug missing data
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
    console.debug('API request', { method, url: `${baseUrl}${path}` });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    throw new ApiError(res.status, parsed);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  // Dev: optionally log response body for debugging
  if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
    try {
      const clone = res.clone();
      const text = await clone.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
      console.debug('API response', { url: `${baseUrl}${path}`, status: res.status, body: parsed });
    } catch (e) {
      // ignore logging errors
    }
  }

  return res.json();
}

export function get<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body);
}

export function del<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}
