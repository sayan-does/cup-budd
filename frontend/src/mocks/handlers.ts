import { http, HttpResponse } from 'msw';

const teams = [
  { id: 1, name: 'Argentina', code: 'ARG', group: 'C', logo_url: null, emoji: '🇦🇷' },
  { id: 2, name: 'Spain', code: 'ESP', group: 'C', logo_url: null, emoji: '🇪🇸' },
  { id: 3, name: 'Mexico', code: 'MEX', group: 'C', logo_url: null, emoji: '🇲🇽' },
  { id: 4, name: 'Saudi Arabia', code: 'KSA', group: 'C', logo_url: null, emoji: '🇸🇦' },
];

const baseStanding = {
  played: 2,
  won: 1,
  drawn: 1,
  lost: 0,
  goalsFor: 3,
  goalsAgainst: 1,
  points: 4,
  form: ['W', 'D'],
};

const liveMatch = {
  id: 101,
  home_team: teams[0],
  away_team: teams[1],
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

const upcomingMatches = [
  {
    id: 102,
    home_team: teams[0],
    away_team: teams[2],
    home_score: null,
    away_score: null,
    status: 'scheduled',
    stage: 'Group C',
    datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Lusail Stadium',
    events: [],
    statistics: [],
  },
  {
    id: 103,
    home_team: teams[3],
    away_team: teams[0],
    home_score: null,
    away_score: null,
    status: 'scheduled',
    stage: 'Group C',
    datetime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Al Bayt Stadium',
    events: [],
    statistics: [],
  },
];

const finishedMatch = {
  id: 100,
  home_team: teams[1],
  away_team: teams[0],
  home_score: 0,
  away_score: 2,
  status: 'finished',
  stage: 'Group C',
  datetime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  venue: 'Lusail Stadium',
  events: [
    { minute: 23, type: 'goal', player: 'Messi', team: 'away' },
    { minute: 67, type: 'yellow_card', player: 'Pedri', team: 'home' },
    { minute: 89, type: 'goal', player: 'Di Maria', team: 'away' },
  ],
  statistics: [
    { label: 'Possession', home: 58, away: 42 },
    { label: 'Shots', home: 10, away: 14 },
    { label: 'Yellow cards', home: 2, away: 1 },
  ],
};

const allMatches = [liveMatch, ...upcomingMatches, finishedMatch];

export const handlers = [
  http.get('*/teams', () => HttpResponse.json(teams)),

  http.get('*/teams/:id', ({ params }) => {
    const id = Number(params.id);
    const team = teams.find((t) => t.id === id);
    if (!team) return new HttpResponse(null, { status: 404 });

    const nextMatch = upcomingMatches.find(
      (m) => m.home_team.id === id || m.away_team.id === id
    );

    return HttpResponse.json({
      id: team.id,
      name: team.name,
      code: team.code,
      group: team.group,
      logo_url: team.logo_url,
      emoji: null,
      live_fixture: null,
      next_fixture: nextMatch ?? null,
      standing: {
        position: 1,
        team: team,
        ...baseStanding,
      },
    });
  }),

  http.get('*/matches', ({ request }) => {
    const url = new URL(request.url);
    const teamId = url.searchParams.get('team_id');
    const status = url.searchParams.get('status');
    const bucket = url.searchParams.get('bucket');
    const limit = url.searchParams.get('limit');

    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    const classify = (m: (typeof allMatches)[0]) => {
      const kickoff = new Date(m.datetime).getTime();
      if (m.status === 'finished') return 'past';
      if ((m.status === 'scheduled' || m.status === 'live') && now >= kickoff + twoHours) return 'past';
      if (m.status === 'live') return 'live';
      if (m.status === 'scheduled' && kickoff <= now && now < kickoff + twoHours) return 'live';
      return 'upcoming';
    };

    let filtered = allMatches;
    if (bucket) filtered = filtered.filter((m) => classify(m) === bucket);
    if (status) filtered = filtered.filter((m) => m.status === status);
    if (teamId) {
      filtered = filtered.filter(
        (m) => m.home_team.id === Number(teamId) || m.away_team.id === Number(teamId),
      );
    }
    if (bucket === 'past') {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
      );
    } else {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
      );
    }
    if (limit) filtered = filtered.slice(0, Number(limit));
    return HttpResponse.json(filtered);
  }),

  http.get('*/matches/:id', ({ params }) => {
    const id = Number(params.id);
    const match = allMatches.find((m) => m.id === id);
    if (!match) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(match);
  }),

  http.get('*/users/me', () =>
    HttpResponse.json({
      id: 'user-1',
      email: 'test@example.com',
      favorite_team_id: 1,
      favorite_team_name: 'Argentina',
      timezone: 'America/New_York',
      preferences: { match_reminders: true, goal_alerts: true, result_summaries: true },
      push_enabled: true,
    }),
  ),

  http.post('*/users', () =>
    HttpResponse.json(
      {
        id: 'user-1',
        email: 'test@example.com',
        favorite_team_id: 1,
        favorite_team_name: 'Argentina',
        timezone: 'America/New_York',
        preferences: { match_reminders: true, goal_alerts: true, result_summaries: true },
        push_enabled: false,
      },
      { status: 201 },
    ),
  ),

  http.patch('*/users/me/*', () => new HttpResponse(null, { status: 204 })),

  http.get('*/push/vapid-public-key', () =>
    HttpResponse.json({ publicKey: 'BNkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkqkq' }),
  ),
];
