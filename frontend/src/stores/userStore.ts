import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Preferences {
  match_reminders: boolean;
  goal_alerts: boolean;
  result_summaries: boolean;
}

interface UserStore {
  email: string | null;
  userId: string | null;
  favoriteTeamId: number | null;
  favoriteTeamName: string | null;
  timezone: string;
  onboardingComplete: boolean;
  preferences: Preferences;
  setEmail: (email: string) => void;
  setTeam: (id: number, name: string) => void;
  setPreferences: (prefs: Partial<Preferences>) => void;
  markOnboardingComplete: () => void;
  clear: () => void;
}

const defaultPreferences: Preferences = {
  match_reminders: true,
  goal_alerts: true,
  result_summaries: true,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      email: null,
      userId: null,
      favoriteTeamId: null,
      favoriteTeamName: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      onboardingComplete: false,
      preferences: { ...defaultPreferences },
      setEmail: (email) => set({ email: email.toLowerCase().trim() }),
      setTeam: (id, name) => set({ favoriteTeamId: id, favoriteTeamName: name }),
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      markOnboardingComplete: () => set({ onboardingComplete: true }),
      clear: () =>
        set({
          email: null,
          userId: null,
          favoriteTeamId: null,
          favoriteTeamName: null,
          onboardingComplete: false,
          preferences: { ...defaultPreferences },
        }),
    }),
    {
      name: 'cup-budd-user',
    },
  ),
);
