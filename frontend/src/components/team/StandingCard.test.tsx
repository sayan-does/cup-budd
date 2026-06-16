import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StandingCard from './StandingCard';

const standing = {
  position: 1,
  team: { id: 1, name: 'Argentina', code: 'ARG', group: 'C', emoji: '🇦🇷' },
  played: 2,
  won: 2,
  drawn: 0,
  lost: 0,
  goalsFor: 5,
  goalsAgainst: 0,
  points: 6,
  form: ['W', 'W'],
};

describe('StandingCard', () => {
  it('renders position, name, points', () => {
    render(<StandingCard standing={standing} />);
    expect(screen.getByText(/1\./)).toBeInTheDocument();
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('PTS')).toBeInTheDocument();
  });

  it('renders form pills', () => {
    render(<StandingCard standing={standing} />);
    expect(screen.getAllByText('W')).toHaveLength(2);
  });
});
