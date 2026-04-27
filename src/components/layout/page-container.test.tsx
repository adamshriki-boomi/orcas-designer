import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageContainer } from './page-container';

describe('PageContainer', () => {
  it('defaults to centered max-w-5xl with horizontal padding', () => {
    const { container } = render(<PageContainer>x</PageContainer>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('mx-auto');
    expect(div.className).toContain('max-w-5xl');
    expect(div.className).toContain('px-6');
    expect(div.className).toContain('pb-12');
  });

  it('uses max-w-6xl when wide', () => {
    const { container } = render(<PageContainer wide>x</PageContainer>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('max-w-6xl');
    expect(div.className).not.toContain('max-w-5xl');
  });

  it('renders w-full with no max-width or auto-margin when fluid', () => {
    const { container } = render(<PageContainer fluid>x</PageContainer>);
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('w-full');
    expect(div.className).not.toMatch(/\bmax-w-/);
    expect(div.className).not.toContain('mx-auto');
    expect(div.className).not.toContain('px-6');
    expect(div.className).not.toContain('pb-12');
  });

  it('merges className in fluid mode', () => {
    const { container } = render(
      <PageContainer fluid className="custom-class">x</PageContainer>
    );
    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toContain('custom-class');
    expect(div.className).toContain('w-full');
  });
});
