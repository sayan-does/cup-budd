import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppShell from './AppShell';

describe('AppShell', () => {
  it('renders children', () => {
    render(<AppShell><p>Hello</p></AppShell>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('has the bordered column wrapper', () => {
    const { container } = render(<AppShell><span>test</span></AppShell>);
    const inner = container.querySelector('.max-w-container-max-width');
    expect(inner).toBeInTheDocument();
  });
});
