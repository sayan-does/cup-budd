import { describe, it, expect } from 'vitest';
import { parseMatchDatetime } from './datetime';

describe('parseMatchDatetime', () => {
  it('parses IST offset datetime', () => {
    const ms = parseMatchDatetime('2026-06-16T04:30:00+05:30');
    expect(ms).not.toBeNull();
    expect(new Date(ms!).toISOString()).toBe('2026-06-15T23:00:00.000Z');
  });

  it('returns null for empty input', () => {
    expect(parseMatchDatetime(null)).toBeNull();
    expect(parseMatchDatetime(undefined)).toBeNull();
    expect(parseMatchDatetime('')).toBeNull();
  });
});
