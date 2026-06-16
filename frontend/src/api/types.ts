export interface TeamOut {
  id: number;
  name: string;
  code: string;
  group: string;
  logo_url: string | null;
  emoji?: string;
}

export interface StandingOut {
  position: number;
  team: TeamOut;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string[];
}

export interface MatchSummaryOut {
  id: number;
  home_team: TeamOut;
  away_team: TeamOut;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
  datetime: string;
  venue: string;
}

export interface TeamDetailOut extends TeamOut {
  live_fixture?: MatchSummaryOut | null;
  next_fixture?: MatchSummaryOut | null;
  standing?: StandingOut | null;
}

export interface MatchDetailOut {
  id: number;
  home_team: TeamOut;
  away_team: TeamOut;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished" | "postponed";
  stage: string;
  datetime: string;
  venue: string;
  events: MatchEventOut[];
  statistics: MatchStatOut[];
}

export interface MatchEventOut {
  minute: number;
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "half_time";
  player?: string;
  team: "home" | "away";
}

export interface MatchStatOut {
  label: string;
  home: number;
  away: number;
}

export interface UserOut {
  id: string;
  email: string;
  favorite_team_id: number | null;
  favorite_team_name: string | null;
  timezone: string;
  preferences: PreferencesOut;
  push_enabled: boolean;
}

export interface PreferencesOut {
  match_reminders: boolean;
  goal_alerts: boolean;
  result_summaries: boolean;
}

export interface VapidKeyOut {
  publicKey: string;
}
