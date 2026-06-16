import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchMatches, type Match } from '../../api/matches';
import { fetchTeam } from '../../api/teams';
import { AppShell, TopAppBar, BottomNavBar } from '../../components/layout';
import { MatchCard } from '../../components/match';
import { EmptyState, ErrorState, SkeletonCard, SectionLabel, Button } from '../../components/ui';
import { useUserStore } from '../../stores/userStore';

type Bucket = 'live' | 'upcoming' | 'past';

interface MatchSectionProps {
  label: string;
  accentColor: 'primary' | 'live-red' | 'accent-ochre';
  bucket: Bucket;
  teamId?: number;
  variant?: 'next' | 'recent';
  emptyTitle: string;
  emptyMessage: string;
  refetchInterval?: number | false;
}

function MatchSection({
  label,
  accentColor,
  bucket,
  teamId,
  variant = 'next',
  emptyTitle,
  emptyMessage,
  refetchInterval = false,
}: MatchSectionProps) {
  const navigate = useNavigate();
  const filters = { bucket, team_id: teamId, limit: 20 };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['matches', bucket, filters],
    queryFn: () => fetchMatches(filters),
    refetchInterval: (query) =>
      refetchInterval && (query.state.data?.length ?? 0) > 0 ? refetchInterval : false,
  });

  return (
    <section>
      <SectionLabel accentColor={accentColor}>{label}</SectionLabel>
      {isLoading && (
        <div className="space-y-4">
          <SkeletonCard height="120px" className="w-full" />
          <SkeletonCard height="120px" className="w-full" />
        </div>
      )}
      {isError && (
        <ErrorState message={`Failed to load ${label.toLowerCase()}`} onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState icon="⚽" title={emptyTitle} message={emptyMessage} />
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((m: Match) => (
            <MatchCard
              key={m.id}
              match={m}
              onClick={() => navigate(`/match/${m.id}`)}
              variant={variant}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Matches() {
  const favoriteTeamId = useUserStore((s) => s.favoriteTeamId);
  const [onlyMyTeam, setOnlyMyTeam] = React.useState(() => !!favoriteTeamId);
  const teamQuery = useQuery({
    queryKey: ['team', favoriteTeamId],
    queryFn: () => fetchTeam(favoriteTeamId!),
    enabled: !!favoriteTeamId,
    staleTime: 5 * 60 * 1000,
  });

  const teamFilter = onlyMyTeam && favoriteTeamId ? favoriteTeamId : undefined;

  return (
    <AppShell>
      <TopAppBar showSettings showMenu />
      <main className="pt-row-min-height px-gutter space-y-stack-lg">
        {teamQuery && teamQuery.data && teamQuery.data.fixture_coverage && !teamQuery.data.fixture_coverage.sync_complete && teamQuery.data.fixture_coverage.has_past && (
          <div>
            <EmptyState icon="🔁" title="Schedule syncing — your team's remaining matches aren't loaded yet." message="Try toggling All matches" />
          </div>
        )}
        {favoriteTeamId && (
          <div className="flex justify-end">
            <Button
              onClick={() => setOnlyMyTeam((v) => !v)}
              className={`px-3 py-1 brutalist-border ${onlyMyTeam ? 'bg-primary text-on-primary' : ''}`}
            >
              {onlyMyTeam ? 'My team' : 'All matches'}
            </Button>
          </div>
        )}

        <MatchSection
          label="Live"
          accentColor="live-red"
          bucket="live"
          teamId={teamFilter}
          variant="recent"
          emptyTitle="No live matches"
          emptyMessage="No matches are live right now"
          refetchInterval={30_000}
        />

        <MatchSection
          label="Upcoming Matches"
          accentColor="primary"
          bucket="upcoming"
          teamId={teamFilter}
          variant="next"
          emptyTitle="No upcoming matches"
          emptyMessage="There are no upcoming matches"
        />

        <MatchSection
          label="Past Matches"
          accentColor="accent-ochre"
          bucket="past"
          teamId={teamFilter}
          variant="recent"
          emptyTitle="No past matches"
          emptyMessage="No finished matches yet"
        />
      </main>
      <BottomNavBar />
    </AppShell>
  );
}

export default Matches;
