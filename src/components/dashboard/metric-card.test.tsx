import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Layers } from 'lucide-react';
import { MetricCard } from './metric-card';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard icon={Layers} label="Total Prompts" value={42} />);
    expect(screen.getByText('Total Prompts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('supports string values', () => {
    render(<MetricCard icon={Layers} label="Status" value="Ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('exposes accessible group labeled by metric name', () => {
    render(<MetricCard icon={Layers} label="Total Prompts" value={0} />);
    expect(screen.getByRole('group', { name: 'Total Prompts' })).toBeInTheDocument();
  });

  it('applies the provided iconColor class', () => {
    const { container } = render(
      <MetricCard icon={Layers} label="A" value={1} iconColor="bg-red-500" />
    );
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('renders zero as "0", not empty', () => {
    render(<MetricCard icon={Layers} label="Empty" value={0} />);
    expect(screen.getByTestId('metric-card-value').textContent).toBe('0');
  });
});
