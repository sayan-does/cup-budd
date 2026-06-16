import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopAppBar from './TopAppBar';

function renderTopAppBar(props = {}) {
  return render(
    <MemoryRouter>
      <TopAppBar {...props} />
    </MemoryRouter>,
  );
}

describe('TopAppBar', () => {
  it('renders title when provided', () => {
    renderTopAppBar({ title: 'Profile' });
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('shows back button when onBack provided', () => {
    renderTopAppBar({ onBack: () => {} });
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  it('shows settings button when showSettings is true', () => {
    renderTopAppBar({ showSettings: true });
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('does not show settings button by default', () => {
    renderTopAppBar();
    expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
  });
});
