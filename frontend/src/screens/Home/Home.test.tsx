import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../mocks/handlers';
import { useUserStore } from '../../stores/userStore';
import Home from './index';

const liveFixture = {
  id: 101,
  home_team: { id: 1, name: 'Argentina', code: 'ARG', group: 'C', logo_url: null, emoji: '🇦🇷' },
  away_team: { id: 2, name: 'Spain', code: 'ESP', group: 'C', logo_url: null, emoji: '🇪🇸' },
  home_score: 1,
  away_score: 0,
  status: 'live',
  stage: 'Group C',
  datetime: new Date().toISOString(),
  venue: 'Lusail Stadium',
};

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  useUserStore.setState({ favoriteTeamId: null, favoriteTeamName: null });
});
afterAll(() => server.close());

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function MatchRoute() {
  const { id } = useParams<{ id: string }>();
  return <div>Match screen {id}</div>;
}

function renderHomeWithRoutes() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/match/:id" element={<MatchRoute />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Home', () => {
  it('shows empty state when no team selected', () => {
    renderHome();
    expect(screen.getByText('Pick a team')).toBeInTheDocument();
  });

  it('renders skeleton on loading', () => {
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHome();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders team data when loaded', async () => {
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Group Standing')).toBeInTheDocument();
    });
  });

  it('shows LiveBanner when team has live fixture', async () => {
    server.use(
      http.get('*/teams/:id', () =>
        HttpResponse.json({
          id: 1,
          name: 'Argentina',
          code: 'ARG',
          group: 'C',
          logo_url: null,
          emoji: '🇦🇷',
          live_fixture: liveFixture,
          next_fixture: null,
          standing: null,
        }),
      ),
    );
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/1.*–.*0/)).toBeInTheDocument();
    });
  });

  it('shows syncing message when sync_complete is false and has_past is true', async () => {
    server.use(
      http.get('*/teams/:id', () =>
        HttpResponse.json({
          id: 1,
          name: 'Argentina',
          code: 'ARG',
          group: 'C',
          logo_url: null,
          emoji: '🇦🇷',
          live_fixture: null,
          next_fixture: null,
          standing: null,
          fixture_coverage: {
            group_fixtures: 1,
            expected_group_fixtures: 3,
            has_upcoming: false,
            has_past: true,
            sync_complete: false,
          },
        }),
      ),
    );
    // Ensure no fallback upcoming match is returned so EmptyState is shown
    server.use(
      http.get('*/matches', () => HttpResponse.json([])),
    );
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/Schedule syncing/)).toBeInTheDocument();
    });
  });

  it('shows no upcoming matches message when sync_complete true and no upcoming', async () => {
    server.use(
      http.get('*/teams/:id', () =>
        HttpResponse.json({
          id: 1,
          name: 'Argentina',
          code: 'ARG',
          group: 'C',
          logo_url: null,
          emoji: '🇦🇷',
          live_fixture: null,
          next_fixture: null,
          standing: null,
          fixture_coverage: {
            group_fixtures: 3,
            expected_group_fixtures: 3,
            has_upcoming: false,
            has_past: true,
            sync_complete: true,
          },
        }),
      ),
    );
    // Ensure no fallback upcoming match is returned so EmptyState is shown
    server.use(
      http.get('*/matches', () => HttpResponse.json([])),
    );
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText(/No upcoming matches/)).toBeInTheDocument();
    });
  });

  it('shows no matches found when fixture_coverage group_fixtures is 0', async () => {
    server.use(
      http.get('*/teams/:id', () =>
        HttpResponse.json({
          id: 1,
          name: 'Argentina',
          code: 'ARG',
          group: 'C',
          logo_url: null,
          emoji: '🇦🇷',
          live_fixture: null,
          next_fixture: null,
          standing: null,
          fixture_coverage: {
            group_fixtures: 0,
            expected_group_fixtures: 3,
            has_upcoming: false,
            has_past: false,
            sync_complete: false,
          },
        }),
      ),
    );
    // Ensure no fallback upcoming match is returned so EmptyState is shown
    server.use(
      http.get('*/matches', () => HttpResponse.json([])),
    );
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHome();
    await waitFor(() => {
      const elems = screen.getAllByText(/No matches found/);
      expect(elems.length).toBeGreaterThan(0);
    });
  });

  it('shows error state when team API is unavailable', async () => {
    server.use(
      http.get('*/teams/:id', () => HttpResponse.error()),
      http.get('*/teams', () => HttpResponse.error()),
      http.get('*/matches', () => HttpResponse.error()),
    );
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHome();
    await waitFor(() => {
      expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
    });
  });

  it('navigates to /match/:id when clicking next match card', async () => {
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderHomeWithRoutes();
    await screen.findByText('Next Match');
    const cards = await screen.findAllByText('Lusail Stadium');
    fireEvent.click(cards[0]);
    await waitFor(() => {
      expect(screen.getByText('Match screen 102')).toBeInTheDocument();
    });
  });
});
