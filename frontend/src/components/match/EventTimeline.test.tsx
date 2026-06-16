import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventTimeline from './EventTimeline';

describe('EventTimeline', () => {
  it('renders events sorted descending', () => {
    const events = [
      { minute: 12, type: 'goal' as const, player: 'Messi', team: 'home' as const },
      { minute: 45, type: 'yellow_card' as const, player: 'Rodri', team: 'away' as const },
    ];
    render(<EventTimeline events={events} />);
    expect(screen.getByText(/45.*YELLOW CARD/)).toBeInTheDocument();
    expect(screen.getByText(/12.*GOAL/)).toBeInTheDocument();
    expect(screen.getByText('Messi')).toBeInTheDocument();
    expect(screen.getByText('Rodri')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<EventTimeline events={[]} />);
    expect(screen.getByText('No events yet')).toBeInTheDocument();
  });
});
