import { useState, useEffect, useCallback } from 'react';

interface UsePushSubscription {
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<void>;
  permissionState: NotificationPermission;
  isSubscribed: boolean;
  isSupported: boolean;
  error: string | null;
  loading: boolean;
  subscription: PushSubscription | null;
}

export function usePushSubscription(): UsePushSubscription {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
        setSubscription(sub);
      });
    });

    setPermissionState(Notification.permission);
  }, [isSupported]);

  const fetchVapidKey = useCallback(async () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const res = await fetch(`${baseUrl}/push/vapid-public-key`);
    const data = await res.json();
    const key = data.publicKey;
    const binary = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return array as unknown as BufferSource;
  }, []);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    setError(null);
    setLoading(true);
    try {
      if (!registration) {
        throw new Error('Service worker not registered');
      }

      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const applicationServerKey = await fetchVapidKey();

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      setIsSubscribed(true);
      setSubscription(sub);
      return sub;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      return null;
    } finally {
      setLoading(false);
    }
  }, [registration, fetchVapidKey]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    try {
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
      }
      setIsSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    }
  }, [registration]);

  return {
    subscribe,
    unsubscribe,
    permissionState,
    isSubscribed,
    isSupported,
    error,
    loading,
    subscription,
  };
}
