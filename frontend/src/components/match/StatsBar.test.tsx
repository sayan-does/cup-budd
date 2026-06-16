import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsBar from './StatsBar';

describe('StatsBar', () => {
  it('renders label and values', () => {
    render(<StatsBar label="Possession" homeValue={54} awayValue={46} />);
    expect(screen.getByText('Possession')).toBeInTheDocument();
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(screen.getByText('46')).toBeInTheDocument();
  });
});
