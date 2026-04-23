import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { FeatureDefinitionData } from '@/lib/types';

// The shared ui/input + ui/textarea components wrap Exosphere web components
// via next/dynamic with ssr:false. They don't render in jsdom. Swap them for
// plain HTML equivalents so we can assert label→input association and value
// reflection like any other React component test.
vi.mock('@/components/ui/input', () => ({
  Input: ({ leadingIcon: _leadingIcon, clearable: _clearable, ...props }: Record<string, unknown>) => (
    <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />
  ),
}));
vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} />
  ),
}));

// Import AFTER the mocks so the component picks up mocked Input/Textarea.
const { StepFeatureDefinition } = await import('./step-feature-definition');

const emptyData: FeatureDefinitionData = {
  mode: 'new',
  name: '',
  briefDescription: '',
};

describe('StepFeatureDefinition', () => {
  it('renders title + description', () => {
    render(<StepFeatureDefinition data={emptyData} onChange={() => {}} />);
    expect(screen.getByRole('heading', { name: /Feature Definition/i })).toBeInTheDocument();
    expect(screen.getByText(/new feature or an improvement/i)).toBeInTheDocument();
  });

  it('renders both mode options with correct initial selection', () => {
    render(<StepFeatureDefinition data={emptyData} onChange={() => {}} />);
    const newBtn = screen.getByRole('button', { name: /New feature/i });
    const improveBtn = screen.getByRole('button', { name: /Improvement of existing feature/i });
    expect(newBtn).toHaveAttribute('aria-pressed', 'true');
    expect(improveBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches selection to improvement when clicked', () => {
    const onChange = vi.fn();
    render(<StepFeatureDefinition data={emptyData} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Improvement of existing feature/i }));
    expect(onChange).toHaveBeenCalledWith({
      mode: 'improvement',
      name: '',
      briefDescription: '',
    });
  });

  it('emits name updates when the input changes', () => {
    const onChange = vi.fn();
    render(<StepFeatureDefinition data={emptyData} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Feature name/i), { target: { value: 'Checkout redesign' } });
    expect(onChange).toHaveBeenCalledWith({
      mode: 'new',
      name: 'Checkout redesign',
      briefDescription: '',
    });
  });

  it('emits brief description updates', () => {
    const onChange = vi.fn();
    render(
      <StepFeatureDefinition
        data={{ ...emptyData, name: 'Already named' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Brief description/i), { target: { value: 'A short brief.' } });
    expect(onChange).toHaveBeenCalledWith({
      mode: 'new',
      name: 'Already named', // preserved
      briefDescription: 'A short brief.',
    });
  });

  it('reflects controlled data props', () => {
    const data: FeatureDefinitionData = {
      mode: 'improvement',
      name: 'Checkout redesign',
      briefDescription: 'Rework the 3-step flow.',
    };
    render(<StepFeatureDefinition data={data} onChange={() => {}} />);

    expect(
      screen.getByRole('button', { name: /Improvement of existing feature/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /New feature/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText(/Feature name/i)).toHaveValue('Checkout redesign');
    expect(screen.getByLabelText(/Brief description/i)).toHaveValue('Rework the 3-step flow.');
  });
});
