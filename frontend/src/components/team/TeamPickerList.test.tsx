import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamPickerList from './TeamPickerList';

const teams = [
  { id: 1, name: 'Argentina', code: 'ARG', group: 'C', emoji: '🇦🇷' },
  { id: 2, name: 'Spain', code: 'ESP', group: 'C', emoji: '🇪🇸' },
  { id: 4, name: 'Brazil', code: 'BRA', group: 'A', emoji: '🇧🇷' },
];

describe('TeamPickerList', () => {
  it('renders all teams grouped', () => {
    render(<TeamPickerList teams={teams} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByText('Brazil')).toBeInTheDocument();
  });

  it('filters by search', () => {
    render(<TeamPickerList teams={teams} selectedId={null} onSelect={() => {}} />);
    const input = screen.getByPlaceholderText('Search teams...');
    fireEvent.change(input, { target: { value: 'arg' } });
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.queryByText('Spain')).not.toBeInTheDocument();
  });

  it('calls onSelect when team clicked', () => {
    const onSelect = vi.fn();
    render(<TeamPickerList teams={teams} selectedId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Argentina'));
    expect(onSelect).toHaveBeenCalledWith(1, 'Argentina');
  });

  it('shows continue button when selected and onContinue provided', () => {
    render(
      <TeamPickerList
        teams={teams}
        selectedId={1}
        onSelect={() => {}}
        onContinue={() => {}}
      />,
    );
    expect(screen.getByText('Continue with Argentina')).toBeInTheDocument();
  });
});
