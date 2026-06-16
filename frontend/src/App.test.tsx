import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
import { useUserStore } from './stores/userStore';
import App from './App';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderApp(initialEntries = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  it('redirects to onboarding when no email', async () => {
    useUserStore.getState().clear();
    renderApp(['/']);
    expect(await screen.findByText('Stay in the loop')).toBeInTheDocument();
  });

  it('renders onboarding at /onboarding', async () => {
    useUserStore.getState().clear();
    renderApp(['/onboarding']);
    expect(await screen.findByText('Stay in the loop')).toBeInTheDocument();
  });

  it('redirects /onboarding to / when onboardingComplete is true', async () => {
    useUserStore.getState().setEmail('test@test.com');
    useUserStore.getState().markOnboardingComplete();
    renderApp(['/onboarding']);
    expect(await screen.findByText('Pick a team')).toBeInTheDocument();
  });

  it('renders match screen at /match/:id', async () => {
    useUserStore.getState().setEmail('test@test.com');
    useUserStore.getState().setTeam(1, 'Argentina');
    renderApp(['/match/101']);
    expect(await screen.findByText('ARG')).toBeInTheDocument();
    expect(screen.getByText('ESP')).toBeInTheDocument();
  });
});
