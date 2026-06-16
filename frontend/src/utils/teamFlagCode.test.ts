import { describe, it, expect } from 'vitest';
import { getTeamFlagClass } from './teamFlagCode';

describe('getTeamFlagClass', () => {
  it('maps FIFA codes to flag-icons classes', () => {
    expect(getTeamFlagClass('ARG')).toBe('fi fi-ar');
    expect(getTeamFlagClass('BRA')).toBe('fi fi-br');
    expect(getTeamFlagClass('ALG')).toBe('fi fi-dz');
    expect(getTeamFlagClass('ENG')).toBe('fi fi-gb-eng');
    expect(getTeamFlagClass('SCO')).toBe('fi fi-gb-sct');
  });

  it('returns null for unknown or missing codes', () => {
    expect(getTeamFlagClass()).toBeNull();
    expect(getTeamFlagClass('')).toBeNull();
    expect(getTeamFlagClass('XYZ')).toBeNull();
  });
});
