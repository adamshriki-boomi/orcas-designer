import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpaLink } from './spa-link';

describe('SpaLink', () => {
  const OLD_ENV = process.env.NEXT_PUBLIC_BASE_PATH;

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/orcas-designer');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (OLD_ENV !== undefined) process.env.NEXT_PUBLIC_BASE_PATH = OLD_ENV;
  });

  it('prepends NEXT_PUBLIC_BASE_PATH to relative hrefs', () => {
    render(<SpaLink href="/researcher/abc-123">go</SpaLink>);
    expect(screen.getByRole('link', { name: 'go' })).toHaveAttribute(
      'href',
      '/orcas-designer/researcher/abc-123'
    );
  });

  it('passes absolute URLs through untouched', () => {
    render(<SpaLink href="https://example.com/page">external</SpaLink>);
    expect(screen.getByRole('link', { name: 'external' })).toHaveAttribute(
      'href',
      'https://example.com/page'
    );
  });

  it('falls back to empty basePath when env var missing', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '');
    render(<SpaLink href="/x">x</SpaLink>);
    expect(screen.getByRole('link', { name: 'x' })).toHaveAttribute('href', '/x');
  });

  it('forwards className and other anchor props', () => {
    render(
      <SpaLink href="/a" className="my-link" data-testid="sl" aria-label="anchor">
        link
      </SpaLink>
    );
    const link = screen.getByTestId('sl');
    expect(link).toHaveClass('my-link');
    expect(link).toHaveAttribute('aria-label', 'anchor');
  });

  it('renders a native anchor element, not a Next.js Link', () => {
    const { container } = render(<SpaLink href="/x">x</SpaLink>);
    const anchor = container.querySelector('a');
    expect(anchor).not.toBeNull();
    // Native anchors do not produce a prefetch request — absence of
    // data-prefetch confirms we are not routed through next/link.
    expect(anchor!.hasAttribute('data-prefetch')).toBe(false);
  });
});
