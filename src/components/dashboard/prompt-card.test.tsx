import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptCard } from './prompt-card';
import { emptyPrompt } from '@/lib/types';
import type { Prompt, DesignProduct } from '@/lib/types';

vi.mock('next/dynamic', () => ({
  default: () => {
    const MockExBadge = ({
      children,
      color,
      shape,
    }: {
      children: React.ReactNode;
      color?: string;
      shape?: string;
    }) => (
      <span data-testid="ex-badge" data-color={color} data-shape={shape}>
        {children}
      </span>
    );
    return MockExBadge;
  },
}));

function makePrompt(overrides: Partial<Prompt> = {}): Prompt {
  const base = emptyPrompt('p1', 'Source Catalog');
  return {
    ...base,
    updatedAt: '2026-04-14T11:00:00Z',
    ...overrides,
  };
}

describe('PromptCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the prompt name and relative time', () => {
    render(<PromptCard project={makePrompt()} />);
    expect(screen.getByText('Source Catalog')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
  });

  it('links to the prompt detail page', () => {
    render(<PromptCard project={makePrompt({ id: 'abc123' })} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('/prompt-generator/abc123'));
  });

  it('shows a gray Draft badge when no prompt has been generated', () => {
    render(<PromptCard project={makePrompt({ generatedPrompt: '' })} />);
    const draft = screen.getByText('Draft');
    expect(draft.closest('[data-testid="ex-badge"]')).toHaveAttribute('data-color', 'gray');
  });

  it('shows a green Generated badge when a prompt has been generated', () => {
    render(<PromptCard project={makePrompt({ generatedPrompt: 'hello world' })} />);
    const generated = screen.getByText('Generated');
    expect(generated.closest('[data-testid="ex-badge"]')).toHaveAttribute('data-color', 'green');
  });

  it('renders one badge per selected design output', () => {
    const products: DesignProduct[] = ['wireframe', 'mockup', 'animated-prototype'];
    render(
      <PromptCard
        project={makePrompt({
          designProducts: { products, figmaDestinationUrl: '' },
        })}
      />,
    );
    expect(screen.getByText('Wireframe')).toBeInTheDocument();
    expect(screen.getByText('Mockup')).toBeInTheDocument();
    expect(screen.getByText('Animated prototype')).toBeInTheDocument();
  });

  it('omits output badges that are not selected', () => {
    render(
      <PromptCard
        project={makePrompt({
          designProducts: { products: ['mockup'], figmaDestinationUrl: '' },
        })}
      />,
    );
    expect(screen.getByText('Mockup')).toBeInTheDocument();
    expect(screen.queryByText('Wireframe')).not.toBeInTheDocument();
    expect(screen.queryByText('Animated prototype')).not.toBeInTheDocument();
  });

  it('renders the feature brief description in the body', () => {
    render(
      <PromptCard
        project={makePrompt({
          featureDefinition: {
            mode: 'new',
            name: 'Source Catalog',
            briefDescription: 'Browse and pick data sources.',
          },
        })}
      />,
    );
    expect(screen.getByText('Browse and pick data sources.')).toBeInTheDocument();
  });

  it('falls back to productInfo text when no feature description is set', () => {
    render(
      <PromptCard
        project={makePrompt({
          productInfo: {
            inputType: 'text',
            urlValue: '',
            textValue: 'Rivery is an ELT platform.',
            files: [],
            additionalContext: '',
          },
        })}
      />,
    );
    expect(screen.getByText('Rivery is an ELT platform.')).toBeInTheDocument();
  });

  it('shows a "No description" placeholder when neither description nor product text exists', () => {
    render(<PromptCard project={makePrompt()} />);
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('shows a Figma indicator only when the destination URL is a valid Figma URL', () => {
    const valid =
      'https://www.figma.com/design/AAAAAAAAAAAAAAAAAAAAAA/Test';
    render(
      <PromptCard
        project={makePrompt({
          designProducts: { products: ['wireframe'], figmaDestinationUrl: valid },
        })}
      />,
    );
    expect(screen.getByText(/Figma/i)).toBeInTheDocument();
  });

  it('does not show a Figma indicator when the destination URL is empty', () => {
    render(
      <PromptCard
        project={makePrompt({
          designProducts: { products: ['wireframe'], figmaDestinationUrl: '' },
        })}
      />,
    );
    expect(screen.queryByText(/Figma/i)).not.toBeInTheDocument();
  });

  it('does not show a Figma indicator for an invalid Figma URL', () => {
    render(
      <PromptCard
        project={makePrompt({
          designProducts: {
            products: ['wireframe'],
            figmaDestinationUrl: 'https://example.com/not-figma',
          },
        })}
      />,
    );
    expect(screen.queryByText(/Figma/i)).not.toBeInTheDocument();
  });

  it('does not show a completion percentage or "fields filled" text (legacy UI removed)', () => {
    const { container } = render(<PromptCard project={makePrompt()} />);
    expect(within(container).queryByText(/fields filled/i)).not.toBeInTheDocument();
    expect(within(container).queryByText(/%/)).not.toBeInTheDocument();
  });
});
