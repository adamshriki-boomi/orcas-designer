import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Layers, Brain, Wand2, RefreshCw } from 'lucide-react';
import { StatsStrip } from './stats-strip';

describe('StatsStrip', () => {
  it('renders one MetricCard per stat', () => {
    render(
      <StatsStrip
        stats={[
          { icon: Layers, label: 'Prompts', value: 5 },
          { icon: Brain, label: 'Memories', value: 10 },
          { icon: Wand2, label: 'Skills', value: 3 },
          { icon: RefreshCw, label: 'Regens', value: 7 },
        ]}
      />
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Prompts')).toBeInTheDocument();
    expect(screen.getByText('Memories')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Regens')).toBeInTheDocument();
  });

  it('exposes an accessible list', () => {
    render(<StatsStrip stats={[]} />);
    expect(screen.getByRole('list', { name: 'Dashboard metrics' })).toBeInTheDocument();
  });

  it('handles empty stats array', () => {
    render(<StatsStrip stats={[]} />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
