import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardHero, greetingFor } from './dashboard-hero';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('DashboardHero', () => {
  it('renders greeting text', () => {
    render(<DashboardHero greeting="Welcome back, Adam" />);
    expect(screen.getByText('Welcome back, Adam')).toBeInTheDocument();
  });

  it('renders optional subtitle', () => {
    render(<DashboardHero greeting="Hi" subtitle="3 research jobs running" />);
    expect(screen.getByText('3 research jobs running')).toBeInTheDocument();
  });

  it('renders three quick-action CTAs with correct hrefs', () => {
    render(<DashboardHero greeting="Hi" />);
    expect(screen.getByTestId('cta-new-prompt').getAttribute('href')).toBe('/prompt-generator/new');
    expect(screen.getByTestId('cta-new-research').getAttribute('href')).toBe('/researcher/new');
    expect(screen.getByTestId('cta-new-ux-analysis').getAttribute('href')).toBe('/ux-writer/new');
  });
});

describe('greetingFor', () => {
  it('uses "Good morning" before noon', () => {
    const now = new Date('2026-04-20T08:00:00.000Z');
    // Avoid timezone surprises by using local hours from the Date object
    const expected = now.getHours() < 12 ? 'Good morning' : 'Good afternoon';
    expect(greetingFor('Adam', now)).toBe(`${expected}, Adam`);
  });

  it('falls back to generic greeting when name is empty', () => {
    const now = new Date('2026-04-20T08:00:00.000Z');
    expect(greetingFor('', now)).toMatch(/^(Good morning|Good afternoon|Good evening)$/);
    expect(greetingFor(null, now)).toMatch(/^(Good morning|Good afternoon|Good evening)$/);
  });

  it('uses only the first name', () => {
    const now = new Date('2026-04-20T08:00:00.000Z');
    const result = greetingFor('Adam Shriki', now);
    expect(result).toContain('Adam');
    expect(result).not.toContain('Shriki');
  });

  it('trims whitespace', () => {
    const now = new Date('2026-04-20T08:00:00.000Z');
    const result = greetingFor('   Adam   ', now);
    expect(result).toContain('Adam');
  });
});
