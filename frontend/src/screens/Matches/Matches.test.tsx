import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { delay, http, HttpResponse } from 'msw';
import { handlers } from '../../mocks/handlers';
import { useUserStore } from '../../stores/userStore';
import Matches from './index';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  useUserStore.setState({ favoriteTeamId: null, favoriteTeamName: null });
});
afterAll(() => server.close());

function renderMatches() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Matches />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Matches', () => {
  it('renders Live, Upcoming, and Past sections', async () => {
    renderMatches();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Matches')).toBeInTheDocument();
    expect(screen.getByText('Past Matches')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryAllByText('Lusail Stadium').length).toBeGreaterThan(0);
    });
  });

  it('shows section skeletons while bucket queries load', async () => {
    server.use(
      http.get('*/matches', async () => {
        await delay(300);
        return HttpResponse.json([]);
      }),
    );
    // Ensure bucket queries don't return a fallback match so EmptyState is shown
    server.use(http.get('*/matches', () => HttpResponse.json([])));
    renderMatches();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText('No live matches')).toBeInTheDocument();
    });
  });

  it('shows My team toggle when favorite team is set', async () => {
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderMatches();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'My team' })).toBeInTheDocument();
    });
  });

  it('passes team_id on all bucket queries when My team is active', async () => {
    const requestedUrls: string[] = [];
    server.use(
      http.get('*/matches', ({ request }) => {
        requestedUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderMatches();
    await waitFor(() => {
      expect(requestedUrls.length).toBeGreaterThanOrEqual(3);
      expect(requestedUrls.every((url) => url.includes('team_id=1'))).toBe(true);
      expect(requestedUrls.some((url) => url.includes('bucket=live'))).toBe(true);
      expect(requestedUrls.some((url) => url.includes('bucket=upcoming'))).toBe(true);
      expect(requestedUrls.some((url) => url.includes('bucket=past'))).toBe(true);
    });
  });

  it('shows syncing message when fixture_coverage indicates incomplete sync', async () => {
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
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderMatches();
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
    // Ensure bucket queries don't return matches so the Upcoming empty state is shown
    server.use(http.get('*/matches', () => HttpResponse.json([])));
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderMatches();
    await waitFor(() => {
      expect(screen.getByText(/No upcoming matches/)).toBeInTheDocument();
    });
  });

  it('shows no matches found when group_fixtures is 0', async () => {
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
    // Ensure bucket queries don't return matches so empty states are shown
    server.use(http.get('*/matches', () => HttpResponse.json([])));
    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderMatches();
    await waitFor(() => {
      expect(screen.getByText('No live matches')).toBeInTheDocument();
      expect(screen.getByText('No upcoming matches')).toBeInTheDocument();
      expect(screen.getByText('No past matches')).toBeInTheDocument();
    });
  });
});
