import { useState, useEffect, useCallback } from 'react';

interface UseInstallPrompt {
  prompt: () => Promise<void>;
  isInstalled: boolean;
  isPromptAvailable: boolean;
}

export function useInstallPrompt(): UseInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      nav.standalone ||
      window.matchMedia('(display-mode: standalone)').matches;

    setIsInstalled(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!deferredPrompt) return;

    const event = deferredPrompt as unknown as { prompt: () => Promise<void> };
    await event.prompt();
    setDeferredPrompt(null);
    setIsInstalled(true);
  }, [deferredPrompt]);

  return {
    prompt,
    isInstalled,
    isPromptAvailable: deferredPrompt !== null,
  };
}
