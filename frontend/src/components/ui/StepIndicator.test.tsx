import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import StepIndicator from './StepIndicator';

describe('StepIndicator', () => {
  it('renders correct number of dots', () => {
    const { container } = render(<StepIndicator steps={5} currentStep={2} />);
    const dots = container.querySelectorAll('.border-black');
    expect(dots).toHaveLength(5);
  });

  it('highlights current step', () => {
    const { container } = render(<StepIndicator steps={3} currentStep={1} />);
    const dots = container.querySelectorAll('.border-black');
    expect(dots[1]).toHaveClass('bg-primary');
  });
});
