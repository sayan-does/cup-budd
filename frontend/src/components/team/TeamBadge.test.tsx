import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamBadge from './TeamBadge';

describe('TeamBadge', () => {
  it('renders flag-icons class when team code is provided', () => {
    const { container } = render(
      <TeamBadge team={{ id: 1, name: 'Argentina', code: 'ARG' }} />
    );
    const flag = container.querySelector('.fi.fi-ar');
    expect(flag).toBeInTheDocument();
    expect(flag).toHaveAttribute('title', 'Argentina flag');
  });

  it('renders text fallback when team code is missing or unmapped', () => {
    render(<TeamBadge team={{ id: 1, name: 'Argentina' }} />);
    expect(screen.getByLabelText('Argentina')).toHaveTextContent('AR');
  });
});
