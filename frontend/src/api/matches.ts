import { get } from './client';
import type { Team } from './teams';

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'half_time';
  player?: string;
  team: 'home' | 'away';
}

export interface MatchStat {
  label: string;
  home: number;
  away: number;
}

export interface Match {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  stage: string;
  datetime: string;
  venue: string;
  events: MatchEvent[];
  statistics: MatchStat[];
}

export interface MatchFilters {
  team_id?: number;
  bucket?: 'live' | 'upcoming' | 'past';
  status?: string;
  limit?: number;
}

export function fetchMatches(filters: MatchFilters = {}): Promise<Match[]> {
  const params = new URLSearchParams();
  if (filters.team_id) params.set('team_id', String(filters.team_id));
  if (filters.bucket) params.set('bucket', filters.bucket);
  if (filters.status) params.set('status', filters.status);
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return get<Match[]>(`/matches${qs ? `?${qs}` : ''}`).then(matches => {
    // DEBUG: Log first match to verify team logo_url
    if (import.meta.env.DEV && matches.length > 0) {
      console.log('[fetchMatches] Sample match data:', {
        homeTeam: matches[0].home_team.name,
        hasHomeLogo: !!matches[0].home_team.logo_url,
        homeLogo: matches[0].home_team.logo_url,
        awayTeam: matches[0].away_team.name,
        hasAwayLogo: !!matches[0].away_team.logo_url,
        awayLogo: matches[0].away_team.logo_url,
      });
    }
    return matches;
  });
}

export function fetchMatch(id: number): Promise<Match> {
  return get<Match>(`/matches/${id}`);
}
