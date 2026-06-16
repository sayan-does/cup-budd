import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GuardedRoute from './GuardedRoute';
import { useUserStore } from '../stores/userStore';

function renderGuarded(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<GuardedRoute />}>
          <Route path="/" element={<p>Home</p>} />
          <Route path="/profile" element={<p>Profile</p>} />
        </Route>
        <Route path="/onboarding" element={<p>Onboarding</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GuardedRoute', () => {
  it('redirects to onboarding when no email', () => {
    useUserStore.getState().clear();
    renderGuarded('/');
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });

  it('renders children when email is set', () => {
    useUserStore.getState().setEmail('test@test.com');
    renderGuarded('/');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('allows access to profile when email is set', () => {
    useUserStore.getState().setEmail('test@test.com');
    renderGuarded('/profile');
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });
});
