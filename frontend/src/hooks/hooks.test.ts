/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePushSubscription } from './usePushSubscription';
import { useIsStandalone } from './useIsStandalone';

function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function mockServiceWorker(subscribeImpl?: () => Promise<PushSubscription>) {
  const mockSub = { endpoint: 'https://example.com', toJSON: () => ({}) } as unknown as PushSubscription;
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
          subscribe: vi.fn().mockImplementation(subscribeImpl ?? (() => Promise.resolve(mockSub))),
        },
      }),
    },
    configurable: true,
    writable: true,
  });
}

function setupNotification() {
  const notif = vi.fn() as any;
  notif.permission = 'default';
  notif.requestPermission = vi.fn().mockResolvedValue('granted');
  (globalThis as any).Notification = notif;
}

beforeEach(() => {
  vi.restoreAllMocks();
  setupNotification();
  (globalThis as any).PushManager = vi.fn();
  mockServiceWorker();
});

describe('usePushSubscription', () => {
  it('granted path subscribes and returns subscription', async () => {
    (globalThis as any).Notification.requestPermission = vi.fn().mockResolvedValue('granted');
    (globalThis as any).Notification.permission = 'granted';

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ publicKey: 'test-key' }),
    });

    const { result } = renderHook(() => usePushSubscription());
    expect(result.current.isSupported).toBe(true);
    await flushMicrotasks();

    const sub = await result.current.subscribe();
    expect(sub).not.toBeNull();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/push/vapid-public-key'));
  });

  it('denied path does NOT subscribe and returns null', async () => {
    (globalThis as any).Notification.requestPermission = vi.fn().mockResolvedValue('denied');
    (globalThis as any).Notification.permission = 'denied';

    globalThis.fetch = vi.fn();

    const { result } = renderHook(() => usePushSubscription());
    expect(result.current.isSupported).toBe(true);
    await flushMicrotasks();

    const sub = await result.current.subscribe();
    expect(sub).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('permissionState reflects Notification.permission', async () => {
    (globalThis as any).Notification.permission = 'granted';

    const { result } = renderHook(() => usePushSubscription());
    await flushMicrotasks();
    expect(result.current.permissionState).toBe('granted');
  });
});

describe('useIsStandalone', () => {
  it('returns true when matchMedia matches standalone', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useIsStandalone());
    expect(result.current).toBe(true);
  });

  it('returns false when matchMedia does not match', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const { result } = renderHook(() => useIsStandalone());
    expect(result.current).toBe(false);
  });
});
