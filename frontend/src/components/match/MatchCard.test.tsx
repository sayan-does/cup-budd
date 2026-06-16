import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MatchCard from './MatchCard';

const match = {
  id: 1,
  home_team: { id: 1, name: 'Argentina', code: 'ARG', emoji: '🇦🇷' },
  away_team: { id: 2, name: 'Spain', code: 'ESP', emoji: '🇪🇸' },
  home_score: 2,
  away_score: 1,
  status: 'finished',
  stage: 'Group C',
  datetime: new Date().toISOString(),
  venue: 'Lusail Stadium',
};

const futureMatch = {
  ...match,
  id: 2,
  datetime: new Date(Date.now() + 86400000).toISOString(),
  home_score: null,
  away_score: null,
};

describe('MatchCard', () => {
  it('renders team names and VS indicator', () => {
    render(<MatchCard match={match} />);
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('renders stage', () => {
    render(<MatchCard match={match} />);
    expect(screen.getByText('Group C')).toBeInTheDocument();
  });

  it('renders time with timezone', () => {
    render(<MatchCard match={futureMatch} timezone="America/New_York" />);
    expect(screen.getByText(/Tomorrow/i)).toBeInTheDocument();
  });

  it('renders recent variant with scores', () => {
    render(<MatchCard match={match} variant="recent" />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });
});
