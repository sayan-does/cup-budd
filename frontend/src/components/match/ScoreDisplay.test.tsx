import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreDisplay from './ScoreDisplay';

describe('ScoreDisplay', () => {
  it('renders correct score', () => {
    render(<ScoreDisplay homeScore={2} awayScore={1} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders dashes for null scores', () => {
    render(<ScoreDisplay homeScore={null} awayScore={null} />);
    const dashes = screen.getAllByText('-');
    expect(dashes).toHaveLength(2);
  });
});
