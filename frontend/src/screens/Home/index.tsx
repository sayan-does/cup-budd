import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchTeam } from '../../api/teams';
import { fetchMatches } from '../../api/matches';
import { useUserStore } from '../../stores/userStore';
import { AppShell, TopAppBar, BottomNavBar } from '../../components/layout';
import { MatchCard, LiveBanner } from '../../components/match';
import { StandingCard } from '../../components/team';
import { EmptyState, ErrorState, SkeletonCard, SectionLabel } from '../../components/ui';
import { parseMatchDatetime } from '../../utils/datetime';

function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const favoriteTeamId = useUserStore((s) => s.favoriteTeamId);

  const teamId = favoriteTeamId;

  const teamQuery = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => fetchTeam(teamId!),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.live_fixture ? 30 * 1000 : false;
    },
  });

  const recentQuery = useQuery({
    queryKey: ['matches', { team_id: teamId, bucket: 'past', limit: 1 }],
    queryFn: () => fetchMatches({ team_id: teamId!, bucket: 'past', limit: 1 }),
    enabled: !!teamId,
  });

  const nextMatchQuery = useQuery({
    queryKey: ['matches', { team_id: teamId, bucket: 'upcoming', limit: 1, fallback: true }],
    queryFn: () => fetchMatches({ team_id: teamId!, bucket: 'upcoming', limit: 1 }),
    // Enable fallback upcoming query when there is no official next_fixture
    // or when the official next_fixture is present but already in the past.
    enabled:
      !!teamId &&
      (!teamQuery.data?.next_fixture ||
        (teamQuery.data?.next_fixture && new Date(teamQuery.data.next_fixture.datetime).getTime() <= Date.now())),
  });

  // debug info
  React.useEffect(() => {
    console.debug('Home queries', { team: teamQuery.data, recent: recentQuery.data, nextFallback: nextMatchQuery.data });
  }, [teamQuery.data, recentQuery.data, nextMatchQuery.data]);

  if (!teamId) {
    return (
      <AppShell >
        <TopAppBar showSettings />
        <EmptyState
          icon="⚽"
          title="Pick a team"
          message="Choose your favorite team to get started"
          actionLabel="Get started"
          onAction={() => navigate('/onboarding')}
        />
        <BottomNavBar />
      </AppShell>
    );
  }

  // Use isPending (not isLoading) so paused/retrying queries still show skeleton.
  const isAnyLoading = teamQuery.isPending || recentQuery.isPending || nextMatchQuery.isPending;

  if (isAnyLoading) {
    return (
      <AppShell >
        <TopAppBar showSettings />
        <div className="pt-row-min-height p-4 space-y-4">
          <SkeletonCard height="120px" className="w-full" />
          <SkeletonCard height="80px" className="w-full" />
          <SkeletonCard height="80px" className="w-full" />
        </div>
        <BottomNavBar />
      </AppShell>
    );
  }

  if (teamQuery.isError || !teamQuery.data) {
    return (
      <AppShell >
        <TopAppBar showSettings />
        <div className="pt-row-min-height">
          <ErrorState
            message="Failed to load team data"
            onRetry={() => {
              queryClient.invalidateQueries({ queryKey: ['team', teamId] });
              queryClient.invalidateQueries({
                queryKey: ['matches', { team_id: teamId, bucket: 'past', limit: 1 }],
              });
              queryClient.invalidateQueries({
                queryKey: ['matches', { team_id: teamId, bucket: 'upcoming', limit: 1, fallback: true }],
              });
            }}
          />
        </div>
        <BottomNavBar />
      </AppShell>
    );
  }

  const team = teamQuery.data;
  const recentMatch = recentQuery.data?.[0];

  const matchIsWithinPastTwoDays =
    recentMatch &&
    new Date(recentMatch.datetime).getTime() > Date.now() - 2 * 24 * 60 * 60 * 1000;

  // Prefer the team's official next_fixture when it is actually in the future.
  // If it's missing or its datetime is in the past, fall back to recent result (if within 2 days)
  // or the scheduled fallback query.
  const nextFixture = team.next_fixture;
  const nextFixtureTimeEpoch = nextFixture ? parseMatchDatetime(nextFixture.datetime) : null;
  const nextFixtureIsFuture = nextFixtureTimeEpoch ? nextFixtureTimeEpoch > Date.now() : false;

  // Debug: print why we chose a particular primary match (dev-only)
  if (import.meta.env.DEV) {
    const now = Date.now();
    const nextFixtureTime = nextFixture ? new Date(nextFixture.datetime).getTime() : null;
    const recentMatchTime = recentMatch ? new Date(recentMatch.datetime).getTime() : null;
    console.debug('Home primary match decision', {
      nowISO: new Date(now).toISOString(),
      nowEpoch: now,
      nextFixture: nextFixture ?? null,
      nextFixtureTimeISO: nextFixtureTime ? new Date(nextFixtureTime).toISOString() : null,
      nextFixtureTimeEpoch: nextFixtureTime,
      nextFixtureIsFuture,
      recentMatch: recentMatch ?? null,
      recentMatchTimeISO: recentMatchTime ? new Date(recentMatchTime).toISOString() : null,
      recentMatchTimeEpoch: recentMatchTime,
      fallback: nextMatchQuery.data?.[0] ?? null,
    });
  }

  const primaryMatch = nextFixtureIsFuture ? nextFixture : (matchIsWithinPastTwoDays ? recentMatch : nextMatchQuery.data?.[0]);
  const primaryIsRecent = !!(primaryMatch && recentMatch && primaryMatch.id === recentMatch.id);

  // Determine contextual empty-state messaging from fixture_coverage
  const coverage = team.fixture_coverage ?? null;
  const noMatchesTitle = (() => {
    if (!coverage) return primaryIsRecent ? 'No recent match' : 'No upcoming match';
    if (coverage.group_fixtures === 0) return `No matches found for ${team.name}.`;
    if (!coverage.sync_complete && coverage.has_past) return "Schedule syncing — your team's remaining matches aren't loaded yet.";
    if (coverage.sync_complete && coverage.has_past && !coverage.has_upcoming) return `No upcoming matches — group stage may be over for ${team.name}.`;
    return primaryIsRecent ? 'No recent match' : 'No upcoming match';
  })();

  const noMatchesMessage = (() => {
    if (!coverage) return 'Check back later';
    if (coverage.group_fixtures === 0) return `No matches found for ${team.name}.`;
    if (!coverage.sync_complete && coverage.has_past) return "Your team's remaining matches aren't loaded yet.";
    if (coverage.sync_complete && coverage.has_past && !coverage.has_upcoming) return `Group stage may be over for ${team.name}.`;
    return 'Check back later';
  })();

  return (
    <AppShell >
      <TopAppBar showSettings showMenu />
      {team.live_fixture && (
        <LiveBanner
          match={team.live_fixture}
          onClick={() => navigate(`/match/${team.live_fixture!.id}`)}
        />
      )}
      <main className="pt-row-min-height px-gutter space-y-stack-lg">
        <section>
          <SectionLabel accentColor={primaryIsRecent ? 'live-red' : 'primary'}>
            {primaryIsRecent ? 'Recent Result' : 'Next Match'}
          </SectionLabel>
            {primaryMatch ? (
              <MatchCard
                match={primaryMatch}
                onClick={() => navigate(`/match/${primaryMatch.id}`)}
                variant={primaryIsRecent ? 'recent' : 'next'}
              />
            ) : (
            <EmptyState
               icon="📅"
               title={noMatchesTitle}
               message={noMatchesMessage}
             />
            )}
        </section>

        {team.standing && (
          <section>
            <SectionLabel accentColor="accent-ochre">Group Standing</SectionLabel>
            <StandingCard standing={team.standing} team={team} isUserTeam />
          </section>
        )}

        {!matchIsWithinPastTwoDays && recentMatch && (
          <section>
            <SectionLabel accentColor="live-red">Recent Result</SectionLabel>
            <MatchCard
              match={recentMatch}
              onClick={() => navigate(`/match/${recentMatch.id}`)}
              variant="recent"
            />
          </section>
        )}
      </main>
      <BottomNavBar />
    </AppShell>
  );
}

export default Home;
