import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '../../mocks/handlers';
import { useUserStore } from '../../stores/userStore';
import Profile from './index';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  useUserStore.getState().clear();
});
afterAll(() => server.close());

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Profile', () => {
  it('renders profile data when loaded', async () => {
    renderProfile();
    expect(await screen.findByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('America/New_York')).toBeInTheDocument();
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('shows Change email button (disabled, Phase 2)', async () => {
    renderProfile();
    await screen.findByText('test@example.com');
    const btn = screen.getByText(/change email/i);
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/phase 2/i);
  });

  it('shows push status label', async () => {
    renderProfile();
    await screen.findByText('test@example.com');
    expect(screen.getByText('Not set up')).toBeInTheDocument();
  });

  it('toggles preference optimistically and calls API', async () => {
    let patched = false;
    server.use(
      http.patch('*/users/me/preferences', () => {
        patched = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderProfile();
    await screen.findByText('test@example.com');
    const toggles = screen.getAllByRole('switch');
    fireEvent.click(toggles[0]);
    await waitFor(() => expect(patched).toBe(true));
  });

  it('shows team change confirm dialog', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    useUserStore.setState({ favoriteTeamId: 1, favoriteTeamName: 'Argentina' });
    renderProfile();
    await screen.findByText('test@example.com');

    fireEvent.click(screen.getByText('Argentina'));
    await screen.findByText('Change team');
    await screen.findByText('Group C');
    fireEvent.click(screen.getByText('Spain'));
    expect(window.confirm).toHaveBeenCalledWith('Switch to Spain?');

    window.confirm = originalConfirm;
  });
});
