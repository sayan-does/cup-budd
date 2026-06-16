import { get } from './client';

export interface Team {
  id: number;
  name: string;
  code: string;
  group: string;
  logo_url: string | null;
  emoji?: string;
}

export interface TeamStanding {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string[];
}

export interface TeamDetail extends Team {
  live_fixture?: MatchSummary | null;
  next_fixture?: MatchSummary | null;
  standing?: TeamStanding | null;
  fixture_coverage?: {
    group_fixtures: number;
    has_past: boolean;
    has_upcoming: boolean;
    sync_complete: boolean;
  } | null;
}

export interface MatchSummary {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
  datetime: string;
  venue: string;
}

export function fetchTeams(): Promise<Team[]> {
  return get<Team[]>('/teams').then(teams => {
    // DEBUG: Log first team to verify logo_url is present
    if (import.meta.env.DEV && teams.length > 0) {
      console.log('[fetchTeams] Sample team data:', teams[0]);
      console.log('[fetchTeams] Teams with logos:', teams.filter(t => t.logo_url).length, '/', teams.length);
    }
    return teams;
  });
}

export function fetchTeam(id: number): Promise<TeamDetail> {
  // Try the per-team endpoint first; if it fails (backend timeout or
  // slow external dependency), fall back to the teams list and synthesize
  // a minimal TeamDetail so the UI can render without blocking.
  return get<TeamDetail>(`/teams/${id}`).catch(async (err) => {
    // eslint-disable-next-line no-console
    console.warn('fetchTeam: team detail failed, falling back to teams list', err);
    const teams = await fetchTeams();
    const t = teams.find((x) => x.id === id);
    if (!t) throw err;
    // minimal TeamDetail shape
    const detail: TeamDetail = {
      id: t.id,
      name: t.name,
      code: t.code,
      group: t.group,
      logo_url: t.logo_url,
      live_fixture: null,
      next_fixture: null,
      standing: null,
    } as TeamDetail;
    return detail;
  });
}
