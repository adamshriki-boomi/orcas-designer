import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { DesignProductsData } from '@/lib/types';

// See step-feature-definition.test.tsx for why these are mocked.
vi.mock('@/components/ui/input', () => ({
  Input: ({ leadingIcon: _leadingIcon, clearable: _clearable, ...props }: Record<string, unknown>) => (
    <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />
  ),
}));

const { StepDesignProducts } = await import('./step-design-products');

const wireframeOnly: DesignProductsData = {
  products: ['wireframe'],
  figmaDestinationUrl: '',
};

describe('StepDesignProducts', () => {
  it('renders title + description', () => {
    render(<StepDesignProducts data={wireframeOnly} onChange={() => {}} />);
    expect(screen.getByRole('heading', { name: /Design Products/i })).toBeInTheDocument();
    expect(screen.getByText(/one or more outputs/i)).toBeInTheDocument();
  });

  it('renders all three product options', () => {
    render(<StepDesignProducts data={wireframeOnly} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Wireframe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Mockup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Animated prototype/i })).toBeInTheDocument();
  });

  it('reflects selected state via aria-pressed', () => {
    render(
      <StepDesignProducts
        data={{ products: ['wireframe', 'mockup'], figmaDestinationUrl: '' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /Wireframe/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Mockup/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Animated prototype/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds a product on click when not selected', () => {
    const onChange = vi.fn();
    render(<StepDesignProducts data={wireframeOnly} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /^Mockup/i }));
    expect(onChange).toHaveBeenCalledWith({
      products: ['wireframe', 'mockup'],
      figmaDestinationUrl: '',
    });
  });

  it('removes a product on click when already selected', () => {
    const onChange = vi.fn();
    render(<StepDesignProducts data={wireframeOnly} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Wireframe/i }));
    expect(onChange).toHaveBeenCalledWith({
      products: [],
      figmaDestinationUrl: '',
    });
  });

  it('shows a validation warning when no products are selected', () => {
    render(
      <StepDesignProducts
        data={{ products: [], figmaDestinationUrl: '' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/Pick at least one output/i)).toBeInTheDocument();
  });

  it('does not show the warning when at least one product is selected', () => {
    render(<StepDesignProducts data={wireframeOnly} onChange={() => {}} />);
    expect(screen.queryByText(/Pick at least one output/i)).not.toBeInTheDocument();
  });

  it('captures Figma destination URL', () => {
    const onChange = vi.fn();
    render(<StepDesignProducts data={wireframeOnly} onChange={onChange} />);
    fireEvent.change(
      screen.getByLabelText(/Figma destination/i),
      { target: { value: 'https://www.figma.com/design/abc/X' } },
    );
    expect(onChange).toHaveBeenCalledWith({
      products: ['wireframe'],
      figmaDestinationUrl: 'https://www.figma.com/design/abc/X',
    });
  });

  it('reflects Figma destination URL in the input', () => {
    render(
      <StepDesignProducts
        data={{ products: ['mockup'], figmaDestinationUrl: 'https://www.figma.com/design/abc/X' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText(/Figma destination/i)).toHaveValue(
      'https://www.figma.com/design/abc/X',
    );
  });

  it('adding a new product keeps existing ones', () => {
    const onChange = vi.fn();
    render(
      <StepDesignProducts
        data={{ products: ['wireframe'], figmaDestinationUrl: '' }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Animated prototype/i }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const [arg] = onChange.mock.calls[0];
    expect(new Set(arg.products)).toEqual(new Set(['wireframe', 'animated-prototype']));
  });
});
