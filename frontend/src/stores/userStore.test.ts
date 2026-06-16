import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from './userStore';

beforeEach(() => {
  useUserStore.getState().clear();
});

describe('userStore', () => {
  it('starts with defaults', () => {
    const state = useUserStore.getState();
    expect(state.email).toBeNull();
    expect(state.favoriteTeamId).toBeNull();
    expect(state.onboardingComplete).toBe(false);
    expect(state.preferences).toEqual({
      match_reminders: true,
      goal_alerts: true,
      result_summaries: true,
    });
  });

  it('setEmail stores lowercased trimmed email', () => {
    useUserStore.getState().setEmail('  FOO@BAR.COM  ');
    expect(useUserStore.getState().email).toBe('foo@bar.com');
  });

  it('setTeam stores id and name', () => {
    useUserStore.getState().setTeam(7, 'Argentina');
    expect(useUserStore.getState().favoriteTeamId).toBe(7);
    expect(useUserStore.getState().favoriteTeamName).toBe('Argentina');
  });

  it('setPreferences merges partial', () => {
    useUserStore.getState().setPreferences({ goal_alerts: false });
    expect(useUserStore.getState().preferences.goal_alerts).toBe(false);
    expect(useUserStore.getState().preferences.match_reminders).toBe(true);
  });

  it('markOnboardingComplete sets flag', () => {
    useUserStore.getState().markOnboardingComplete();
    expect(useUserStore.getState().onboardingComplete).toBe(true);
  });

  it('clear resets all state', () => {
    useUserStore.getState().setEmail('test@test.com');
    useUserStore.getState().setTeam(1, 'Test');
    useUserStore.getState().markOnboardingComplete();
    useUserStore.getState().clear();
    expect(useUserStore.getState().email).toBeNull();
    expect(useUserStore.getState().favoriteTeamId).toBeNull();
    expect(useUserStore.getState().onboardingComplete).toBe(false);
  });
});
