import { useQuery } from '@tanstack/react-query';
import { AppShell, TopAppBar, BottomNavBar } from '../../components/layout';
import { StandingCard } from '../../components/team';
import TeamBadge from '../../components/team/TeamBadge';
import { SectionLabel, EmptyState, ErrorState, SkeletonCard } from '../../components/ui';
import { get } from '../../api/client';
import { fetchTeam, fetchTeams } from '../../api/teams';
import { useUserStore } from '../../stores/userStore';
import React from 'react';

interface StandingEntry {
  position: number;
  team: { id: number; name: string; code: string; group: string; logo_url?: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goals_for: number;
  goals_against: number;
}

function Table() {
  // default group should come from user's favorite team's group when available
  const favoriteTeamId = useUserStore((s) => s.favoriteTeamId);
  const [group, setGroup] = React.useState('C');

  // fetch favorite team to derive default group when available
  const favTeamQuery = useQuery({
    queryKey: ['team', favoriteTeamId],
    queryFn: () => fetchTeam(favoriteTeamId!),
    enabled: !!favoriteTeamId,
    staleTime: 5 * 60 * 1000,
  });

  // only set default once when favorite team loads and user hasn't changed group
  const initializedRef = React.useRef(false);
  React.useEffect(() => {
    if (!initializedRef.current && favTeamQuery.data?.group) {
      setGroup(favTeamQuery.data.group);
      initializedRef.current = true;
    }
  }, [favTeamQuery.data]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['standings', { group }],
    queryFn: async () => get<StandingEntry[]>(`/standings?group=${encodeURIComponent(group)}`),
  });

  const sortedData = React.useMemo(() => {
    if (!data) return [] as StandingEntry[];
    return data.slice().sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goals_for - a.goals_against;
      const gdB = b.goals_for - b.goals_against;
      if (gdB !== gdA) return gdB - gdA;
      return a.team.name.localeCompare(b.team.name);
    });
  }, [data]);
  const [view] = React.useState<'table' | 'list'>('table');

  return (
    <AppShell>
      <TopAppBar showSettings showMenu />
      <main className="pt-row-min-height px-gutter space-y-stack-lg">
        <section>
          <div className="flex items-center justify-between">
            <SectionLabel accentColor="accent-ochre">Group Table</SectionLabel>
            <div>
              <label className="sr-only">Select group</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="border-2 border-black px-2 py-1 bg-white brutalist-border"
              >
                {['A','B','C','D','E','F','G','H'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* simplified: always show table view by default */}

          {isLoading && (
            <div className="space-y-4">
              <SkeletonCard height="120px" className="w-full" />
              <SkeletonCard height="120px" className="w-full" />
            </div>
          )}

  {isError && <ErrorState message="Failed to load standings" onRetry={() => refetch()} />}
          {!isLoading && !isError && data && data.length === 0 && (
            // Fallback: if external standings are unavailable, fetch the
            // teams for the selected group and render a simple list so the
            // Table tab isn't blank. This avoids needing a full computed
            // standings implementation.
            <TeamsFallback group={group} favoriteTeamId={favoriteTeamId} />
          )}

          {!isLoading && !isError && data && data.length > 0 && (
            <div>
              {view === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2">#</th>
                        <th className="text-left p-2">Team</th>
                        <th className="text-right p-2">P</th>
                        <th className="text-right p-2">W</th>
                        <th className="text-right p-2">D</th>
                        <th className="text-right p-2">L</th>
                        <th className="text-right p-2">GF</th>
                        <th className="text-right p-2">GA</th>
                        <th className="text-right p-2">GD</th>
                        <th className="text-right p-2">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((s, idx) => (
                        <tr
                          key={`${s.team.id ?? 'team'}-${idx}`}
                          className={`border-t-2 ${s.team.id === favoriteTeamId ? 'bg-primary/10' : ''}`}
                        >
                          <td className="p-2 align-middle font-space text-2xl font-black">{idx + 1}.</td>
                          <td className="p-2">
                            <div className="flex items-center gap-3">
                              <TeamBadge team={{ id: s.team.id, name: s.team.name, code: s.team.code, logo_url: s.team.logo_url }} size="sm" bordered />
                              <span className="font-space font-bold uppercase">{s.team.name}</span>
                            </div>
                          </td>
                          <td className="p-2 text-right font-bold">{s.played}</td>
                          <td className="p-2 text-right">{s.won}</td>
                          <td className="p-2 text-right">{s.drawn}</td>
                          <td className="p-2 text-right">{s.lost}</td>
                          <td className="p-2 text-right">{s.goals_for}</td>
                          <td className="p-2 text-right">{s.goals_against}</td>
                          <td className="p-2 text-right font-bold">{s.goals_for - s.goals_against}</td>
                          <td className="p-2 text-right">
                            <span className="font-black bg-black text-white px-3 py-1 rounded-none inline-block">{s.points}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.map((s) => (
                    <StandingCard
                      key={s.team.id}
                      standing={{
                        position: s.position,
                        team: { id: s.team.id, name: s.team.name, code: s.team.code, group: s.team.group, logo_url: s.team.logo_url },
                        played: s.played,
                        won: s.won,
                        drawn: s.drawn,
                        lost: s.lost,
                        goalsFor: s.goals_for,
                        goalsAgainst: s.goals_against,
                        points: s.points,
                        form: [],
                      }}
                      isUserTeam={s.team.id === favoriteTeamId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <BottomNavBar />
    </AppShell>
  );
}

export default Table;

function TeamsFallback({ group, favoriteTeamId }: { group: string; favoriteTeamId: number | null }) {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', { group }],
    queryFn: async () => fetchTeams().then((all) => all.filter((t) => t.group === group)),
    enabled: !!group,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard height="120px" className="w-full" />
        <SkeletonCard height="120px" className="w-full" />
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return <EmptyState icon="📊" title="No table data" message="Standings are not available" />;
  }

  return (
    <div className="space-y-3">
      {teams.map((t) => (
        <div key={t.id} className={`flex items-center justify-between p-2 border-t-2 ${t.id === favoriteTeamId ? 'bg-primary/10' : ''}`}>
          <div className="flex items-center gap-3">
            <TeamBadge team={{ id: t.id, name: t.name, code: t.code, logo_url: t.logo_url }} size="sm" bordered />
            <span className="font-space font-bold uppercase">{t.name}</span>
          </div>
          <div className="text-sm text-slate-600">Group {t.group}</div>
        </div>
      ))}
    </div>
  );
}
