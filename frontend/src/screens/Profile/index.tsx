import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMe, updatePreferences, updatePushSubscription } from '../../api/users';
import { fetchTeams } from '../../api/teams';
import { useUserStore } from '../../stores/userStore';
import { usePushSubscription } from '../../hooks/usePushSubscription';
import { AppShell, TopAppBar, BottomNavBar } from '../../components/layout';
import { TeamBadge } from '../../components/team';
import { Toggle, Button } from '../../components/ui';
import TeamPickerModal from './TeamPickerModal';

function Profile() {
  const queryClient = useQueryClient();
  const store = useUserStore();
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const push = usePushSubscription();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const prefsMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handlePrefChange = (key: string, value: boolean) => {
    store.setPreferences({ [key]: value });
    prefsMutation.mutate({ [key]: value });
  };

  const team = profile
    ? {
        id: profile.favorite_team_id!,
        name: profile.favorite_team_name!,
        code: teams?.find((t) => t.id === profile.favorite_team_id)?.code,
        logo_url: profile.favorite_team_logo_url || null,
      }
    : null;

  const handleEnablePush = async () => {
    const sub = await push.subscribe();
    if (sub) {
      const json = sub.toJSON();
      await updatePushSubscription({
        endpoint: json.endpoint!,
        keys: json.keys! as { p256dh: string; auth: string },
      });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  };

  const pushLabel = () => {
    if (push.permissionState === 'denied') return 'Blocked';
    if (push.permissionState === 'default') return 'Not set up';
    if (!push.isSubscribed) return 'Needs setup';
    return 'Enabled';
  };

  const showPushEnable =
    push.isSupported &&
    (push.permissionState === 'default' ||
      (push.permissionState === 'granted' && !push.isSubscribed));

  if (isLoading) {
    return (
      <AppShell >
        <TopAppBar title="Profile" />
        <div className="pt-[64px] flex-1 flex items-center justify-center p-6">
          <p className="text-body-md text-on-surface opacity-50">Loading...</p>
        </div>
        <BottomNavBar />
      </AppShell>
    );
  }

  return (
    <AppShell >
      <TopAppBar title="Profile" />

      <main className="pt-[64px] flex-1 pb-24">
        <section className="p-gutter">
          <div className="bg-primary brutalist-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <h2 className="font-headline-lg text-2xl font-black text-on-primary uppercase italic">World Cup Fan</h2>
            <p className="text-sm font-bold text-on-primary/80 uppercase">Member since {new Date().getFullYear()}</p>
          </div>
        </section>

        <section className="px-gutter mb-stack-lg">
          <h3 className="font-section-label text-on-surface uppercase mb-stack-sm border-l-4 border-black pl-1">Account</h3>
          <div className="bg-white brutalist-border divide-y-2 divide-black">
            <div className="flex items-center px-4 h-row-min-height">
              <span className="material-symbols-outlined text-on-surface mr-3">mail</span>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-on-surface/60">Email</p>
                <p className="font-bold text-on-surface">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center px-4 h-row-min-height">
              <span className="material-symbols-outlined text-on-surface mr-3">schedule</span>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-on-surface/60">Timezone</p>
                <p className="font-bold text-on-surface">{profile?.timezone}</p>
              </div>
            </div>
            <div className="px-4 py-3">
              <button
                disabled
                className="w-full h-12 bg-surface-variant text-on-surface/40 font-black text-xs uppercase border-2 border-black cursor-not-allowed opacity-50"
              >
                Change email (Phase 2)
              </button>
            </div>
          </div>
        </section>

        <section className="px-gutter mb-stack-lg">
          <h3 className="font-section-label text-on-surface uppercase mb-stack-sm border-l-4 border-live-red pl-1">My Team</h3>
          <button
            onClick={() => setShowTeamPicker(true)}
            className="w-full flex items-center px-4 h-row-min-height bg-white brutalist-border brutalist-shadow-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            {team ? (
              <>
                <TeamBadge team={{ id: team.id, name: team.name }} size="sm" bordered />
                <span className="flex-1 font-black text-on-surface uppercase ml-3">{team.name}</span>
              </>
            ) : (
              <span className="text-base text-on-surface opacity-60">Select a team</span>
            )}
            <span className="material-symbols-outlined text-on-surface font-bold">arrow_forward</span>
          </button>
        </section>

        <section className="px-gutter mb-stack-lg">
          <h3 className="font-section-label text-on-surface uppercase mb-stack-sm border-l-4 border-primary pl-1">Push Status</h3>
          <div className="bg-white brutalist-border p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center border-2 border-black px-3 py-1 ${pushLabel() === 'Enabled' ? 'bg-accent-ochre' : 'bg-surface-variant'}`}>
                <span className={`w-3 h-3 mr-2 ${pushLabel() === 'Enabled' ? 'bg-black' : 'bg-on-surface/40'}`} />
                <span className="text-xs font-black uppercase text-on-surface">{pushLabel()}</span>
              </div>
            </div>
            {showPushEnable && (
              <button
                onClick={handleEnablePush}
                disabled={push.loading}
                className="px-4 py-2 bg-live-red text-white font-black text-xs uppercase brutalist-border brutalist-shadow-sm disabled:opacity-50"
              >
                {push.loading ? 'Enabling...' : 'Enable'}
              </button>
            )}
          </div>
        </section>

        <section className="px-gutter mb-stack-lg">
          <h3 className="font-section-label text-on-surface uppercase mb-stack-sm border-l-4 border-black pl-1">Notifications</h3>
          <div className="bg-white brutalist-border divide-y-2 divide-black px-4">
            <Toggle
              label="Match reminders (1hr, 15min)"
              checked={profile?.preferences?.match_reminders ?? false}
              onChange={(v) => handlePrefChange('match_reminders', v)}
            />
            <Toggle
              label="Goal alerts"
              checked={profile?.preferences?.goal_alerts ?? false}
              onChange={(v) => handlePrefChange('goal_alerts', v)}
            />
            <Toggle
              label="Full-time results"
              checked={profile?.preferences?.result_summaries ?? false}
              onChange={(v) => handlePrefChange('result_summaries', v)}
            />
          </div>
        </section>

        <section className="px-gutter mb-12">
          <Button variant="danger" className="w-full" disabled>
            Sign Out
          </Button>
          <p className="text-center mt-4 font-bold text-[10px] text-on-surface uppercase tracking-[0.2em] opacity-50">
            App Version 1.0.0
          </p>
        </section>
      </main>

      {showTeamPicker && (
        <TeamPickerModal
          teams={teams ?? []}
          selectedId={profile?.favorite_team_id ?? null}
          onClose={() => setShowTeamPicker(false)}
        />
      )}

      <BottomNavBar />
    </AppShell>
  );
}

export default Profile;
