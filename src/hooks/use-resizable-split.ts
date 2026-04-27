import { useCallback, useEffect, useRef, useState } from 'react';

export function clampPct(pct: number, min: number, max: number): number {
  if (Number.isNaN(pct)) return min;
  if (pct < min) return min;
  if (pct > max) return max;
  return pct;
}

interface UseResizableSplitOptions {
  storageKey: string;
  defaultPct?: number;
  minPct?: number;
  maxPct?: number;
}

interface UseResizableSplitReturn {
  pct: number;
  setPct: (next: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  startDrag: (e: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  isDragging: boolean;
}

function readStorage(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore quota / private mode errors
  }
}

export function useResizableSplit({
  storageKey,
  defaultPct = 60,
  minPct = 25,
  maxPct = 75,
}: UseResizableSplitOptions): UseResizableSplitReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pct, setPctState] = useState<number>(defaultPct);
  const [isDragging, setIsDragging] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    const saved = readStorage(storageKey);
    if (saved !== null) {
      setPctState(clampPct(saved, minPct, maxPct));
    }
    // Intentional: only run once per storageKey on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setPct = useCallback(
    (next: number) => {
      const clamped = clampPct(next, minPct, maxPct);
      setPctState(clamped);
      writeStorage(storageKey, clamped);
    },
    [storageKey, minPct, maxPct]
  );

  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      const handle = e.currentTarget;
      const container = containerRef.current;
      if (!container) return;

      handle.setPointerCapture?.(e.pointerId);
      setIsDragging(true);
      document.body.style.userSelect = 'none';

      const onMove = (ev: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0) return;
        const next = ((ev.clientX - rect.left) / rect.width) * 100;
        setPctState(clampPct(next, minPct, maxPct));
      };

      const onUp = (ev: PointerEvent) => {
        handle.releasePointerCapture?.(ev.pointerId);
        document.body.style.userSelect = '';
        setIsDragging(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        // Persist final value
        setPctState((current) => {
          writeStorage(storageKey, current);
          return current;
        });
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [storageKey, minPct, maxPct]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const step = e.shiftKey ? 5 : 1;
      const delta = e.key === 'ArrowRight' ? step : -step;
      setPctState((current) => {
        const next = clampPct(current + delta, minPct, maxPct);
        writeStorage(storageKey, next);
        return next;
      });
    },
    [storageKey, minPct, maxPct]
  );

  return { pct, setPct, containerRef, startDrag, onKeyDown, isDragging };
}
