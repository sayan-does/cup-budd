import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveBanner from './LiveBanner';

const match = {
  id: 1,
  home_team: { id: 1, name: 'Argentina', code: 'ARG' },
  away_team: { id: 2, name: 'Spain', code: 'ESP' },
  home_score: 1,
  away_score: 0,
};

describe('LiveBanner', () => {
  it('renders live indicator and score', () => {
    render(<LiveBanner match={match} />);
    expect(screen.getByText('Live Now')).toBeInTheDocument();
    expect(screen.getByText(/ARG 1 – 0 ESP/)).toBeInTheDocument();
  });
});
