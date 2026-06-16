export const MOCK_TEAMS = [
  { id: 1, name: 'Argentina', code: 'ARG', group: 'C', logo_url: null, emoji: '🇦🇷' },
  { id: 2, name: 'Spain', code: 'ESP', group: 'C', logo_url: null, emoji: '🇪🇸' },
  { id: 3, name: 'Mexico', code: 'MEX', group: 'C', logo_url: null, emoji: '🇲🇽' },
  { id: 4, name: 'Saudi Arabia', code: 'KSA', group: 'C', logo_url: null, emoji: '🇸🇦' },
];

export const MOCK_TEAM_DETAIL = {
  id: 1,
  name: 'Argentina',
  code: 'ARG',
  group: 'C',
  logo_url: null,
  emoji: '🇦🇷',
  live_fixture: null,
  next_fixture: {
    id: 101,
    home_team: MOCK_TEAMS[0],
    away_team: MOCK_TEAMS[1],
    home_score: null,
    away_score: null,
    status: 'scheduled',
    stage: 'Group C',
    datetime: new Date(Date.now() + 86400000).toISOString(),
    venue: 'Lusail Stadium',
  },
  standing: {
    position: 1,
    team: MOCK_TEAMS[0],
    played: 2,
    won: 2,
    drawn: 0,
    lost: 0,
    goalsFor: 5,
    goalsAgainst: 0,
    points: 6,
    form: ['W', 'W'],
  },
};

export const MOCK_LIVE_MATCH = {
  id: 101,
  home_team: MOCK_TEAMS[0],
  away_team: MOCK_TEAMS[1],
  home_score: 1,
  away_score: 0,
  status: 'live',
  stage: 'Group C',
  datetime: new Date().toISOString(),
  venue: 'Lusail Stadium',
  events: [
    { minute: 12, type: 'goal', player: 'Messi', team: 'home' },
    { minute: 45, type: 'yellow_card', player: 'Rodri', team: 'away' },
  ],
  statistics: [
    { label: 'Possession', home: 54, away: 46 },
    { label: 'Shots', home: 12, away: 8 },
    { label: 'Yellow cards', home: 1, away: 2 },
  ],
};

export const MOCK_FINISHED_MATCH = {
  ...MOCK_LIVE_MATCH,
  id: 102,
  status: 'finished',
  home_score: 2,
  away_score: 1,
  datetime: new Date(Date.now() - 86400000).toISOString(),
  events: [
    { minute: 23, type: 'goal', player: 'Messi', team: 'home' },
    { minute: 67, type: 'goal', player: 'Torres', team: 'away' },
    { minute: 89, type: 'goal', player: 'Di Maria', team: 'home' },
  ],
};

export const MOCK_USER_PROFILE = {
  id: 'user-1',
  email: 'test@example.com',
  favorite_team_id: 1,
  favorite_team_name: 'Argentina',
  timezone: 'America/New_York',
  preferences: { match_reminders: true, goal_alerts: true, result_summaries: true },
  push_enabled: true,
};

export const MOCK_USER_STATE = {
  state: {
    email: 'test@example.com',
    userId: null,
    favoriteTeamId: 1,
    favoriteTeamName: 'Argentina',
    timezone: 'America/New_York',
    onboardingComplete: true,
    preferences: {
      match_reminders: true,
      goal_alerts: true,
      result_summaries: true,
    },
  },
  version: 0,
};

export const MOCK_USER_STATE_NO_TEAM = {
  state: {
    email: 'test@example.com',
    userId: null,
    favoriteTeamId: null,
    favoriteTeamName: null,
    timezone: 'America/New_York',
    onboardingComplete: true,
    preferences: {
      match_reminders: true,
      goal_alerts: true,
      result_summaries: true,
    },
  },
  version: 0,
};

export const MOCK_USER_STATE_ONBOARDING_INCOMPLETE = {
  state: {
    email: '',
    userId: null,
    favoriteTeamId: null,
    favoriteTeamName: null,
    timezone: 'America/New_York',
    onboardingComplete: false,
    preferences: {
      match_reminders: true,
      goal_alerts: true,
      result_summaries: true,
    },
  },
  version: 0,
};
