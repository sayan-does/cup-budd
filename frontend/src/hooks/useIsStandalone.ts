import { useState, useEffect } from 'react';

export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const check =
      nav.standalone ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(check);
  }, []);

  return isStandalone;
}
