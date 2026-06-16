import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsStandalone } from './useIsStandalone';

describe('useIsStandalone', () => {
  it('returns false by default (not in standalone)', () => {
    const { result } = renderHook(() => useIsStandalone());
    expect(result.current).toBe(false);
  });
});
