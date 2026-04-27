import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useResizableSplit, clampPct } from './use-resizable-split';

describe('clampPct', () => {
  it('returns value when within bounds', () => {
    expect(clampPct(50, 25, 75)).toBe(50);
  });

  it('clamps to min', () => {
    expect(clampPct(10, 25, 75)).toBe(25);
  });

  it('clamps to max', () => {
    expect(clampPct(90, 25, 75)).toBe(75);
  });

  it('handles non-finite by returning min', () => {
    expect(clampPct(NaN, 25, 75)).toBe(25);
    expect(clampPct(Infinity, 25, 75)).toBe(75);
  });
});

describe('useResizableSplit', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with defaultPct when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
    );
    expect(result.current.pct).toBe(60);
  });

  it('hydrates from localStorage on mount', () => {
    window.localStorage.setItem('test.k', '42');
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
    );
    expect(result.current.pct).toBe(42);
  });

  it('clamps hydrated value to min/max', () => {
    window.localStorage.setItem('test.k', '95');
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60, minPct: 25, maxPct: 75 })
    );
    expect(result.current.pct).toBe(75);
  });

  it('ignores corrupt localStorage value and keeps default', () => {
    window.localStorage.setItem('test.k', 'not-a-number');
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
    );
    expect(result.current.pct).toBe(60);
  });

  it('setPct clamps and persists to localStorage', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60, minPct: 25, maxPct: 75 })
    );
    act(() => result.current.setPct(90));
    expect(result.current.pct).toBe(75);
    expect(window.localStorage.getItem('test.k')).toBe('75');
  });

  it('onKeyDown ArrowRight increments by 1 and persists', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
    );
    act(() => {
      result.current.onKeyDown({
        key: 'ArrowRight',
        shiftKey: false,
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent<HTMLElement>);
    });
    expect(result.current.pct).toBe(61);
    expect(window.localStorage.getItem('test.k')).toBe('61');
  });

  it('onKeyDown ArrowLeft decrements by 1', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
    );
    act(() => {
      result.current.onKeyDown({
        key: 'ArrowLeft',
        shiftKey: false,
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent<HTMLElement>);
    });
    expect(result.current.pct).toBe(59);
  });

  it('onKeyDown Shift+Arrow steps by 5', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
    );
    act(() => {
      result.current.onKeyDown({
        key: 'ArrowRight',
        shiftKey: true,
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent<HTMLElement>);
    });
    expect(result.current.pct).toBe(65);
  });

  it('onKeyDown ignores non-arrow keys', () => {
    const { result } = renderHook(() =>
      useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
    );
    act(() => {
      result.current.onKeyDown({
        key: 'Enter',
        shiftKey: false,
        preventDefault: () => {},
      } as unknown as React.KeyboardEvent<HTMLElement>);
    });
    expect(result.current.pct).toBe(60);
  });

  it('survives a localStorage that throws on read', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('quota');
    };
    try {
      const { result } = renderHook(() =>
        useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
      );
      expect(result.current.pct).toBe(60);
    } finally {
      Storage.prototype.getItem = original;
    }
  });

  it('survives a localStorage that throws on write', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
    try {
      const { result } = renderHook(() =>
        useResizableSplit({ storageKey: 'test.k', defaultPct: 60 })
      );
      expect(() => act(() => result.current.setPct(70))).not.toThrow();
      expect(result.current.pct).toBe(70);
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
