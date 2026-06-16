import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { fetchTeams, fetchTeam } from './teams';
import { fetchMatches, fetchMatch } from './matches';
import { createUser, updateTeam, updatePreferences, updatePushSubscription } from './users';
import { getVapidPublicKey } from './push';

const server = setupServer(
  http.get('*/teams', () => HttpResponse.json([{ id: 1, name: 'Argentina' }])),
  http.get('*/teams/:id', ({ params }) =>
    HttpResponse.json({ id: Number(params.id), name: 'Argentina', next_fixture: null, standing: null }),
  ),
  http.get('*/matches', () => HttpResponse.json([{ id: 1, status: 'live' }])),
  http.get('*/matches/:id', ({ params }) =>
    HttpResponse.json({ id: Number(params.id), status: 'live', home_score: 1, away_score: 0 }),
  ),
  http.post('*/users', () => HttpResponse.json({ id: 'u1', email: 'test@test.com' }, { status: 201 })),
  http.patch('*/users/me/team', () => HttpResponse.json(null, { status: 204 })),
  http.patch('*/users/me/preferences', () => HttpResponse.json(null, { status: 204 })),
  http.patch('*/users/me/push-subscription', () => HttpResponse.json(null, { status: 204 })),
  http.get('*/push/vapid-public-key', () =>
    HttpResponse.json({ publicKey: 'test-key' }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API endpoints', () => {
  it('getTeams() hits GET /teams', async () => {
    const teams = await fetchTeams();
    expect(teams).toHaveLength(1);
  });

  it('getTeam() hits GET /teams/:id', async () => {
    const team = await fetchTeam(1);
    expect(team.id).toBe(1);
  });

  it('getMatches() hits GET /matches', async () => {
    const matches = await fetchMatches();
    expect(matches[0].status).toBe('live');
  });

  it('getMatch() hits GET /matches/:id', async () => {
    const match = await fetchMatch(1);
    expect(match.home_score).toBe(1);
  });

  it('createUser() POSTs /users', async () => {
    const user = await createUser({ email: 'test@test.com', favorite_team_id: 1, timezone: 'UTC', preferences: { match_reminders: true, goal_alerts: true, result_summaries: true } });
    expect(user.email).toBe('test@test.com');
  });

  it('updateTeam() PATCHes /users/me/team', async () => {
    await expect(updateTeam(2)).resolves.toBeUndefined();
  });

  it('updatePreferences() PATCHes /users/me/preferences', async () => {
    await expect(updatePreferences({ goal_alerts: false })).resolves.toBeUndefined();
  });

  it('updatePushSubscription() PATCHes /users/me/push-subscription', async () => {
    await expect(updatePushSubscription({ endpoint: 'https://example.com', keys: { p256dh: 'key', auth: 'auth' } })).resolves.toBeUndefined();
  });

  it('getVapidPublicKey() GETs /push/vapid-public-key', async () => {
    const res = await getVapidPublicKey();
    expect(res.publicKey).toBe('test-key');
  });
});
