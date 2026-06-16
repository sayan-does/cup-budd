import { get, post, patch, del } from './client';

export interface UserProfile {
  id: string;
  email: string;
  favorite_team_id: number | null;
  favorite_team_name: string | null;
  favorite_team_logo_url: string | null;
  timezone: string;
  preferences: {
    match_reminders: boolean;
    goal_alerts: boolean;
    result_summaries: boolean;
  };
  push_enabled: boolean;
}

export interface CreateUserData {
  email: string;
  favorite_team_id: number;
  timezone: string;
  preferences: {
    match_reminders: boolean;
    goal_alerts: boolean;
    result_summaries: boolean;
  };
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function fetchMe(): Promise<UserProfile> {
  return get<UserProfile>('/users/me');
}

export function createUser(data: CreateUserData): Promise<UserProfile> {
  return post<UserProfile>('/users', data);
}

export function updateTeam(teamId: number): Promise<void> {
  return patch<void>(`/users/me/team`, { favorite_team_id: teamId });
}

export function updatePreferences(prefs: Record<string, boolean>): Promise<void> {
  return patch<void>('/users/me/preferences', prefs);
}

export function updatePushSubscription(sub: PushSubscriptionData): Promise<void> {
  return patch<void>('/users/me/push-subscription', sub);
}

export function deletePushSubscription(): Promise<void> {
  return del<void>('/users/me/push-subscription');
}
