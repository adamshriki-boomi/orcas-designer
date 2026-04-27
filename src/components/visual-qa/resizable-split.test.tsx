import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ResizableSplit } from './resizable-split';

describe('ResizableSplit', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders both children', () => {
    render(
      <ResizableSplit storageKey="t.k">
        <div data-testid="left">L</div>
        <div data-testid="right">R</div>
      </ResizableSplit>
    );
    expect(screen.getByTestId('left')).toBeInTheDocument();
    expect(screen.getByTestId('right')).toBeInTheDocument();
  });

  it('exposes a vertical separator with default valuenow', () => {
    render(
      <ResizableSplit storageKey="t.k" defaultPct={60}>
        <div>L</div>
        <div>R</div>
      </ResizableSplit>
    );
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    expect(sep).toHaveAttribute('aria-valuenow', '60');
    expect(sep).toHaveAttribute('aria-valuemin', '25');
    expect(sep).toHaveAttribute('aria-valuemax', '75');
    expect(sep).toHaveAttribute('tabindex', '0');
  });

  it('applies the percentage to the left pane width style', () => {
    render(
      <ResizableSplit storageKey="t.k" defaultPct={70}>
        <div data-testid="left">L</div>
        <div data-testid="right">R</div>
      </ResizableSplit>
    );
    const leftWrapper = screen.getByTestId('left').parentElement as HTMLElement;
    expect(leftWrapper.style.width).toBe('70%');
  });

  it('ArrowRight on separator increases aria-valuenow and width', () => {
    render(
      <ResizableSplit storageKey="t.k" defaultPct={60}>
        <div data-testid="left">L</div>
        <div data-testid="right">R</div>
      </ResizableSplit>
    );
    const sep = screen.getByRole('separator');
    fireEvent.keyDown(sep, { key: 'ArrowRight' });
    expect(sep).toHaveAttribute('aria-valuenow', '61');
    const leftWrapper = screen.getByTestId('left').parentElement as HTMLElement;
    expect(leftWrapper.style.width).toBe('61%');
    expect(window.localStorage.getItem('t.k')).toBe('61');
  });

  it('Shift+ArrowLeft decrements by 5', () => {
    render(
      <ResizableSplit storageKey="t.k" defaultPct={60}>
        <div>L</div>
        <div>R</div>
      </ResizableSplit>
    );
    const sep = screen.getByRole('separator');
    fireEvent.keyDown(sep, { key: 'ArrowLeft', shiftKey: true });
    expect(sep).toHaveAttribute('aria-valuenow', '55');
  });

  it('hydrates from localStorage', () => {
    window.localStorage.setItem('t.k', '40');
    render(
      <ResizableSplit storageKey="t.k" defaultPct={60}>
        <div data-testid="left">L</div>
        <div>R</div>
      </ResizableSplit>
    );
    const leftWrapper = screen.getByTestId('left').parentElement as HTMLElement;
    expect(leftWrapper.style.width).toBe('40%');
  });

  it('clamps to min/max bounds', () => {
    render(
      <ResizableSplit storageKey="t.k" defaultPct={75} minPct={25} maxPct={75}>
        <div>L</div>
        <div>R</div>
      </ResizableSplit>
    );
    const sep = screen.getByRole('separator');
    fireEvent.keyDown(sep, { key: 'ArrowRight' });
    expect(sep).toHaveAttribute('aria-valuenow', '75');
  });
});
