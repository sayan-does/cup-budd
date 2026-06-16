import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';
import { useUserStore } from '../../stores/userStore';
import Onboarding from './index';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  useUserStore.getState().clear();
});
afterAll(() => server.close());

function renderOnboarding() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function completeEmailStep(email = 'test@example.com') {
  const input = screen.getByPlaceholderText('Email');
  fireEvent.change(input, { target: { value: email } });
  fireEvent.click(screen.getByText('Continue'));
}

describe('Onboarding', () => {
  it('renders step 1 (email)', () => {
    renderOnboarding();
    expect(screen.getByText('Stay in the loop')).toBeInTheDocument();
  });

  it('validates email on step 1', () => {
    renderOnboarding();
    const input = screen.getByPlaceholderText('Email');
    const button = screen.getByText('Continue');

    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.click(button);
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
  });

  it('advances to step 2 after valid email', async () => {
    renderOnboarding();
    completeEmailStep();
    expect(await screen.findByText('Pick your team')).toBeInTheDocument();
  });

  it('advances to team picker and shows team options', async () => {
    renderOnboarding();
    completeEmailStep();
    expect(await screen.findByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
  });
});
