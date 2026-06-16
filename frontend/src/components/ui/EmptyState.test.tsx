import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(<EmptyState icon="📭" title="Nothing here" message="No matches yet" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('No matches yet')).toBeInTheDocument();
  });

  it('shows action button when provided', () => {
    const onAction = vi.fn();
    render(<EmptyState icon="📭" title="Empty" message="No data" actionLabel="Refresh" onAction={onAction} />);
    fireEvent.click(screen.getByText('Refresh'));
    expect(onAction).toHaveBeenCalled();
  });
});
