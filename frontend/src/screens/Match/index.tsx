import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fetchMatch } from '../../api/matches';
import { AppShell, TopAppBar, BottomNavBar } from '../../components/layout';
import { TeamBadge } from '../../components/team';
import { ScoreDisplay, EventTimeline, StatsBar } from '../../components/match';
import { ErrorState, SkeletonCard } from '../../components/ui';

function Match() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const matchId = Number(id);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
    enabled: !!matchId,
    refetchInterval: (query) =>
      query.state.data?.status === 'live' ? 30_000 : false,
  });

  if (isLoading) {
    return (
      <AppShell >
        <TopAppBar onBack={() => navigate(-1)} title="Live Match" />
        <div className="pt-row-min-height p-4 space-y-4">
          <SkeletonCard height="180px" />
          <SkeletonCard height="100px" />
          <SkeletonCard height="200px" />
        </div>
        <BottomNavBar />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell >
        <TopAppBar onBack={() => navigate(-1)} title="Live Match" />
        <div className="pt-row-min-height">
          <ErrorState
            message={error instanceof Error ? error.message : 'Failed to load match'}
            onRetry={() => refetch()}
          />
        </div>
        <BottomNavBar />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell >
        <TopAppBar onBack={() => navigate(-1)} title="Live Match" />
        <div className="pt-row-min-height">
          <ErrorState message="Match not found" />
        </div>
        <BottomNavBar />
      </AppShell>
    );
  }

  // If this is a finished match but there are no events, show a helpful note and log the response
  if (data.status === 'finished' && (!data.events || data.events.length === 0)) {
    console.debug('Match has no events', { matchId: data.id, events: data.events });
  }

  const statusBadge = () => {
    switch (data.status) {
      case 'live':
        return (
          <span className="flex items-center gap-2 px-4 py-1 bg-black text-white border-2 border-white animate-pulse">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="font-bold text-xs uppercase">{new Date(data.datetime).getMinutes()}' LIVE</span>
          </span>
        );
      case 'finished':
        return (
          <span className="px-4 py-1 bg-black text-white font-bold text-xs uppercase">Full Time</span>
        );
      case 'postponed':
        return (
          <span className="px-4 py-1 bg-black text-white font-bold text-xs uppercase">Postponed</span>
        );
      case 'scheduled':
        return (
          <span className="px-4 py-1 bg-black text-white font-bold text-xs uppercase">
            {formatDistanceToNow(new Date(data.datetime), { addSuffix: true })}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell >
      <TopAppBar onBack={() => navigate(-1)} title="Live Match" />

      <main className="pt-row-min-height flex-grow flex flex-col pb-24">
        <section className="bg-accent-ochre border-b-2 border-black p-6 flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-1/2 h-full bg-accent-ochre" />
            <div className="w-1/2 h-full bg-primary" />
          </div>
          <div className="flex items-center justify-center w-full gap-8 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="brutalist-border neo-brutalist-card">
                <TeamBadge team={data.home_team} size="lg" />
              </div>
              <span className="font-bold text-sm uppercase tracking-widest text-black bg-white px-2 border border-black">
                {data.home_team.code || data.home_team.name.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-6xl font-black tracking-tighter text-black bg-white px-4 border-2 border-black brutalist-shadow">
                <ScoreDisplay homeScore={data.home_score} awayScore={data.away_score} size="xl" />
              </div>
              <div className="mt-4">
                {statusBadge()}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="brutalist-border neo-brutalist-card">
                <TeamBadge team={data.away_team} size="lg" />
              </div>
              <span className="font-bold text-sm uppercase tracking-widest text-black bg-white px-2 border border-black">
                {data.away_team.code || data.away_team.name.slice(0, 3).toUpperCase()}
              </span>
            </div>
          </div>
        </section>

        {data.statistics.length > 0 && (
          <section className="p-gutter flex flex-col gap-stack-md">
            <div className="bg-white brutalist-border p-4 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <h2 className="font-bold text-xs uppercase tracking-wider">Match Statistics</h2>
                <span className="material-symbols-outlined text-black">query_stats</span>
              </div>
              <div className="space-y-6">
                {data.statistics.map((stat) => (
                  <StatsBar
                    key={stat.label}
                    label={stat.label}
                    homeValue={stat.home}
                    awayValue={stat.away}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="px-gutter pt-4 pb-8 flex flex-col gap-stack-md">
          <div className="bg-white brutalist-border p-4 flex flex-col gap-stack-md">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <h2 className="font-bold text-xs uppercase tracking-wider">Match Timeline</h2>
              <span className="material-symbols-outlined text-black">schedule</span>
            </div>
            <EventTimeline events={data.events} />
            {import.meta.env.DEV && (
              <details className="mt-2 text-xs text-on-surface/60">
                <summary className="cursor-pointer">Raw events (dev)</summary>
                <pre className="whitespace-pre-wrap max-h-48 overflow-auto mt-2">{JSON.stringify(data.events, null, 2)}</pre>
              </details>
            )}
          </div>
        </section>
      </main>

      <BottomNavBar />
    </AppShell>
  );
}

export default Match;
