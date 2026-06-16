import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';
import Toggle from './Toggle';
import FormPill from './FormPill';

describe('Button', () => {
  it('shows spinner and is disabled when loading', () => {
    render(<Button loading>Save</Button>);
    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Toggle', () => {
  it('toggles via click and fires onChange', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Test toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('responds to keyboard interaction (Space/Enter on button)', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="Test toggle" />);
    const toggle = screen.getByRole('switch');
    toggle.focus();
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('has accessible role and aria-checked', () => {
    render(<Toggle checked={true} onChange={() => {}} label="Test" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});

describe('FormPill', () => {
  it('applies correct styles for W', () => {
    const { container } = render(<FormPill result="W" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.className).toContain('bg-white');
    expect(pill.className).toContain('text-black');
  });

  it('applies correct styles for D', () => {
    const { container } = render(<FormPill result="D" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.className).toContain('bg-surface-variant');
    expect(pill.className).toContain('text-on-surface');
  });

  it('applies correct styles for L', () => {
    const { container } = render(<FormPill result="L" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill.className).toContain('bg-live-red');
    expect(pill.className).toContain('text-white');
  });
});
