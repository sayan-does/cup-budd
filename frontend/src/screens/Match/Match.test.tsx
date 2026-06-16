import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../mocks/handlers';
import Match from './index';

const baseMatch = {
  id: 101,
  home_team: { id: 1, name: 'Argentina', code: 'ARG', group: 'C', logo_url: null, emoji: '🇦🇷' },
  away_team: { id: 2, name: 'Spain', code: 'ESP', group: 'C', logo_url: null, emoji: '🇪🇸' },
  home_score: 1,
  away_score: 0,
  stage: 'Group C',
  datetime: new Date().toISOString(),
  venue: 'Lusail Stadium',
  events: [
    { minute: 12, type: 'goal', player: 'Messi', team: 'home' },
    { minute: 45, type: 'yellow_card', player: 'Rodri', team: 'away' },
  ],
  statistics: [
    { label: 'Possession', home: 54, away: 46 },
    { label: 'Shots', home: 12, away: 8 },
  ],
};

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

function renderMatch(id = '101') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/match/${id}`]}>
        <Routes>
          <Route path="/match/:id" element={<Match />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Match screen', () => {
  it('shows loading initially', () => {
    renderMatch();
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders live match data', async () => {
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText('ARG')).toBeInTheDocument();
    });
    expect(screen.getByText('ESP')).toBeInTheDocument();
    expect(screen.getByText(/Match Statistics/)).toBeInTheDocument();
    expect(screen.getByText('Messi')).toBeInTheDocument();
    expect(screen.getByText('Possession')).toBeInTheDocument();
  });

  it('shows Full Time for finished match', async () => {
    server.use(
      http.get('*/matches/:id', () =>
        HttpResponse.json({ ...baseMatch, status: 'finished', events: [], statistics: [] }),
      ),
    );
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText('Full Time')).toBeInTheDocument();
    });
  });

  it('shows scheduled countdown for scheduled match', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    server.use(
      http.get('*/matches/:id', () =>
        HttpResponse.json({ ...baseMatch, status: 'scheduled', datetime: futureDate, home_score: null, away_score: null, events: [], statistics: [] }),
      ),
    );
    renderMatch();
    await waitFor(() => {
      expect(screen.getByText(/in \d+ day/i)).toBeInTheDocument();
    });
  });
});
