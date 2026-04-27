'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, ArrowLeftRight } from 'lucide-react';
import type { IconButtonType, IconButtonSize } from '@boomi/exosphere';

type ViewMode = 'stacked' | 'overlay';
type TopLayer = 'design' | 'impl';

interface ModeToggleProps {
  mode: ViewMode;
  onChange: (next: ViewMode) => void;
}

// CRITICAL: ExSegmentedControls registers click listeners on its children inside
// `firstUpdated()` (which runs once). If parent and children are loaded via
// separate `next/dynamic` imports, the parent can mount before its children and
// end up with zero registered segments — clicks then silently do nothing.
// Bundling them in a single dynamic import guarantees the children exist as
// real <ex-segmentedcontrol> nodes when firstUpdated runs.
// The same pattern is used by `src/components/layout/breadcrumbs.tsx`.
const ModeToggle = dynamic(
  () =>
    import('@boomi/exosphere').then(({ ExSegmentedControls, ExSegmentedControl }) => ({
      default: function ModeToggleInner({ mode, onChange }: ModeToggleProps) {
        return (
          <ExSegmentedControls
            aria-label="View mode"
            onSelectionChange={(e: CustomEvent<{ index: number }>) => {
              // Runtime fires `selectedIndex` though the TS type says `index`.
              // Same shape mismatch as ExTab — see ui/tabs.tsx.
              const detail = e.detail as { index?: number; selectedIndex?: number };
              const idx = detail.selectedIndex ?? detail.index ?? 0;
              onChange(idx === 1 ? 'overlay' : 'stacked');
            }}
          >
            <ExSegmentedControl label="Stacked" selected={mode === 'stacked'} />
            <ExSegmentedControl label="Overlay" selected={mode === 'overlay'} />
          </ExSegmentedControls>
        );
      },
    })),
  { ssr: false }
);

const ExIconButtonLazy = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExIconButton })),
  { ssr: false }
);

interface VisualQaImageViewerProps {
  designImageUrl: string;
  implImageUrl: string;
  designFigmaUrl: string | null;
}

const STORAGE = {
  mode: 'vqa.viewer.mode',
  opacity: 'vqa.viewer.opacity',
  topLayer: 'vqa.viewer.topLayer',
} as const;

function readMode(): ViewMode | null {
  try {
    const v = window.localStorage.getItem(STORAGE.mode);
    return v === 'overlay' || v === 'stacked' ? v : null;
  } catch {
    return null;
  }
}
function readOpacity(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE.opacity);
    if (raw == null) return null;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  } catch {
    return null;
  }
}
function readTopLayer(): TopLayer | null {
  try {
    const v = window.localStorage.getItem(STORAGE.topLayer);
    return v === 'design' || v === 'impl' ? v : null;
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function VisualQaImageViewer({
  designImageUrl,
  implImageUrl,
  designFigmaUrl,
}: VisualQaImageViewerProps) {
  const [mode, setModeState] = useState<ViewMode>('stacked');
  const [opacity, setOpacityState] = useState<number>(50);
  const [topLayer, setTopLayerState] = useState<TopLayer>('design');

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const m = readMode();
    if (m) setModeState(m);
    const o = readOpacity();
    if (o !== null) setOpacityState(o);
    const t = readTopLayer();
    if (t) setTopLayerState(t);
  }, []);

  const setMode = useCallback((next: ViewMode) => {
    setModeState(next);
    writeStorage(STORAGE.mode, next);
  }, []);

  const setOpacity = useCallback((next: number) => {
    const clamped = Math.min(100, Math.max(0, next));
    setOpacityState(clamped);
    writeStorage(STORAGE.opacity, String(clamped));
  }, []);

  const swap = useCallback(() => {
    setTopLayerState((prev) => {
      const next = prev === 'design' ? 'impl' : 'design';
      writeStorage(STORAGE.topLayer, next);
      return next;
    });
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[var(--exo-color-border-default,#e2e8f0)] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--exo-color-border-default,#e2e8f0)] bg-white px-3 py-2 rounded-t-lg">
        <ModeToggle mode={mode} onChange={setMode} />

        {mode === 'overlay' && (
          <>
            <label htmlFor="vqa-opacity" className="text-xs text-gray-700">
              Opacity
            </label>
            <input
              id="vqa-opacity"
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="vqa-range"
              aria-label="Opacity"
            />
            <span className="w-10 text-xs tabular-nums text-gray-700">{opacity}%</span>
            <ExIconButtonLazy
              // Exosphere icon registry uses kebab-case names — `swap_horiz`
              // (Material Design) renders as an empty box. See
              // node_modules/@boomi/exosphere/dist/icon.js for the catalog.
              icon="double-arrow"
              type={'tertiary' as IconButtonType}
              size={'small' as IconButtonSize}
              tooltipText={`Swap top: currently ${topLayer === 'design' ? 'Design' : 'Implementation'}`}
              label="Swap top layer"
              onClick={swap}
            />
            {/* Fallback icon for environments where Exosphere icons don't render */}
            <span aria-hidden className="sr-only">
              <ArrowLeftRight />
            </span>
          </>
        )}

        {designFigmaUrl && (
          <a
            href={designFigmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex cursor-pointer items-center gap-1 text-sm underline"
          >
            <ExternalLink className="size-3.5" /> Open in Figma
          </a>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3">
        {mode === 'stacked' ? (
          <StackedView
            designImageUrl={designImageUrl}
            implImageUrl={implImageUrl}
          />
        ) : (
          <OverlayView
            designImageUrl={designImageUrl}
            implImageUrl={implImageUrl}
            opacity={opacity}
            topLayer={topLayer}
          />
        )}
      </div>
    </div>
  );
}

interface StackedViewProps {
  designImageUrl: string;
  implImageUrl: string;
}

function StackedView({ designImageUrl, implImageUrl }: StackedViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <ImagePanel title="Design" imageUrl={designImageUrl} alt="Design" pendingMessage="Rendering Figma design…" />
      <ImagePanel title="Implementation" imageUrl={implImageUrl} alt="Implementation" />
    </div>
  );
}

interface ImagePanelProps {
  title: string;
  imageUrl: string;
  alt: string;
  pendingMessage?: string;
}

function ImagePanel({ title, imageUrl, alt, pendingMessage }: ImagePanelProps) {
  return (
    <section>
      <header className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--exo-color-font-secondary,#475569)]">
          {title}
        </span>
      </header>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="block w-full object-contain" />
      ) : pendingMessage ? (
        <div
          role="img"
          aria-label={`${alt} pending`}
          className="flex h-48 items-center justify-center text-sm text-[var(--exo-color-font-secondary,#475569)]"
        >
          {pendingMessage}
        </div>
      ) : null}
    </section>
  );
}

interface OverlayViewProps {
  designImageUrl: string;
  implImageUrl: string;
  opacity: number;
  topLayer: TopLayer;
}

function OverlayView({ designImageUrl, implImageUrl, opacity, topLayer }: OverlayViewProps) {
  const designOnTop = topLayer === 'design';
  const topUrl = designOnTop ? designImageUrl : implImageUrl;
  const bottomUrl = designOnTop ? implImageUrl : designImageUrl;
  const topAlt = designOnTop ? 'Design' : 'Implementation';
  const bottomAlt = designOnTop ? 'Implementation' : 'Design';

  return (
    <section>
      <header className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--exo-color-font-secondary,#475569)]">
          Overlay (top: {topAlt})
        </span>
      </header>
      <div className="relative w-full">
        <img
          src={bottomUrl}
          alt={bottomAlt}
          className="block w-full object-contain"
          data-testid="overlay-bottom"
        />
        <img
          src={topUrl}
          alt={topAlt}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ opacity: opacity / 100 }}
          data-testid="overlay-top"
        />
      </div>
    </section>
  );
}
