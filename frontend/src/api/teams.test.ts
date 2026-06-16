import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';
import { fetchTeams, fetchTeam } from './teams';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('teams API', () => {
  it('fetchTeams returns team list', async () => {
    const teams = await fetchTeams();
    expect(teams).toHaveLength(4);
    expect(teams[0].name).toBe('Argentina');
  });

  it('fetchTeam returns team detail', async () => {
    const team = await fetchTeam(1);
    expect(team.name).toBe('Argentina');
    expect(team.next_fixture).toBeDefined();
    expect(team.standing).toBeDefined();
  });
});
