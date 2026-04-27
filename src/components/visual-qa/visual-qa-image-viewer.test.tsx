import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(
  resolve(__dirname, 'visual-qa-image-viewer.tsx'),
  'utf-8'
);

// Mock Exosphere to plain HTML so jsdom can render and tests can interact.
vi.mock('@boomi/exosphere', () => ({
  ExSegmentedControls: ({
    children,
    onSelectionChange,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onSelectionChange?: (e: CustomEvent<{ index: number }>) => void;
    'aria-label'?: string;
  }) => {
    const arr = Array.isArray(children) ? children : [children];
    return (
      <div role="tablist" aria-label={ariaLabel}>
        {arr.map((child, i) => {
          if (!child || typeof child !== 'object' || !('props' in child)) return child;
          const props = (child as { props: { label?: string; selected?: boolean } }).props;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={props.selected ? 'true' : 'false'}
              onClick={() => {
                // Real Exosphere fires `selectedIndex`; the React wrapper's
                // TS detail says `index`. Cast to mimic the runtime event.
                const ev = new CustomEvent('selectionChange', {
                  detail: { selectedIndex: i },
                });
                onSelectionChange?.(ev as unknown as CustomEvent<{ index: number }>);
              }}
            >
              {props.label}
            </button>
          );
        })}
      </div>
    );
  },
  ExSegmentedControl: ({ label, selected }: { label?: string; selected?: boolean }) => (
    <span data-label={label} data-selected={selected ? 'true' : 'false'}>{label}</span>
  ),
  ExIconButton: ({
    icon,
    tooltipText,
    onClick,
    label,
  }: {
    icon?: string;
    tooltipText?: string;
    onClick?: () => void;
    label?: string;
  }) => (
    <button
      type="button"
      aria-label={label ?? tooltipText ?? icon}
      data-icon={icon}
      onClick={onClick}
    >
      {tooltipText ?? icon}
    </button>
  ),
}));

const { VisualQaImageViewer } = await import('./visual-qa-image-viewer');

// REGRESSION GUARD: ExSegmentedControls registers click listeners on its
// children inside `firstUpdated()` — a one-shot Lit lifecycle. If the parent
// and the child segments are loaded via two separate `next/dynamic({ssr:false})`
// imports, the parent can mount before its children, find an empty children
// list, register zero listeners, and silently break clicks forever (until the
// page reloads with a different timing). The fix is to bundle parent + children
// in a single dynamic import so the whole `<ex-segmentedcontrols>` subtree
// hydrates atomically. The same pattern is used by breadcrumbs.tsx.
//
// These tests assert the source still has the bundled pattern. If they fail,
// someone has split the imports and re-introduced the race condition.
describe('VisualQaImageViewer source — segmented control bundling', () => {
  it('bundles ExSegmentedControls + ExSegmentedControl in a single dynamic import', () => {
    // The bundled pattern: a dynamic() that imports @boomi/exosphere and
    // destructures BOTH names in the same .then() handler.
    expect(SOURCE).toMatch(
      /import\(\s*['"]@boomi\/exosphere['"]\s*\)\s*\.then\(\s*\(?\{[^}]*ExSegmentedControls[^}]*ExSegmentedControl[^}]*\}\)?/
    );
  });

  it('does not export ExSegmentedControl as a standalone dynamic component', () => {
    // The race-prone pattern looks like:
    //   const X = dynamic(() => import('@boomi/exosphere').then((m) => ({ default: m.ExSegmentedControl })), …)
    //   const Y = dynamic(() => import('@boomi/exosphere').then((m) => ({ default: m.ExSegmentedControls })), …)
    // i.e. `default: <something>.ExSegmentedControl(s)?` at the top level.
    // The bundled pattern never assigns either name to a `default:` key — it
    // returns `default: function ModeToggleInner(…) { … }` and uses the names
    // inside the JSX. So flag any `default:` line that points directly at the
    // segmented-control names.
    const directDefault = /default\s*:\s*[A-Za-z_$.]*\bExSegmentedControls?\b/;
    expect(SOURCE).not.toMatch(directDefault);
  });
});

describe('VisualQaImageViewer', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('Stacked mode', () => {
    it('renders both Design and Implementation images', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      expect(screen.getByAltText('Design')).toHaveAttribute('src', '/d.png');
      expect(screen.getByAltText('Implementation')).toHaveAttribute('src', '/i.png');
    });

    it('shows the Open in Figma link when designFigmaUrl is provided', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl="https://figma.com/design/abc?node-id=1-2"
        />
      );
      const link = screen.getByRole('link', { name: /open in figma/i });
      expect(link).toHaveAttribute('href', 'https://figma.com/design/abc?node-id=1-2');
    });

    it('omits the Figma link when designFigmaUrl is null', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      expect(screen.queryByRole('link', { name: /open in figma/i })).toBeNull();
    });

    it('shows a "Rendering Figma design…" placeholder when designImageUrl is empty', () => {
      render(
        <VisualQaImageViewer
          designImageUrl=""
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      expect(screen.getByLabelText('Design pending')).toBeInTheDocument();
    });

    it('does not show the opacity slider in stacked mode', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      expect(screen.queryByLabelText(/opacity/i)).toBeNull();
    });
  });

  describe('Overlay mode', () => {
    it('switches to overlay when the Overlay tab is clicked', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      // Overlay slider becomes visible
      expect(screen.getByLabelText(/opacity/i)).toBeInTheDocument();
    });

    it('renders an opacity slider with default 50%', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      const slider = screen.getByLabelText(/opacity/i) as HTMLInputElement;
      expect(slider.type).toBe('range');
      expect(slider.value).toBe('50');
    });

    it('updates top image opacity when slider changes', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      const slider = screen.getByLabelText(/opacity/i) as HTMLInputElement;
      fireEvent.change(slider, { target: { value: '25' } });
      const topImage = screen.getByTestId('overlay-top') as HTMLImageElement;
      expect(topImage.style.opacity).toBe('0.25');
    });

    it('design is on top by default', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      const top = screen.getByTestId('overlay-top') as HTMLImageElement;
      const bottom = screen.getByTestId('overlay-bottom') as HTMLImageElement;
      expect(top.alt).toBe('Design');
      expect(bottom.alt).toBe('Implementation');
    });

    it('swap button flips which image is on top', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      const swap = screen.getByRole('button', { name: /swap/i });
      fireEvent.click(swap);
      const top = screen.getByTestId('overlay-top') as HTMLImageElement;
      expect(top.alt).toBe('Implementation');
    });
  });

  describe('persistence', () => {
    it('persists the selected mode to localStorage', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      expect(window.localStorage.getItem('vqa.viewer.mode')).toBe('overlay');
    });

    it('hydrates mode from localStorage on mount', async () => {
      window.localStorage.setItem('vqa.viewer.mode', 'overlay');
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      // useEffect-based hydration — flush effects
      await act(async () => {});
      expect(screen.getByLabelText(/opacity/i)).toBeInTheDocument();
    });

    it('persists opacity changes', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      fireEvent.change(screen.getByLabelText(/opacity/i), { target: { value: '20' } });
      expect(window.localStorage.getItem('vqa.viewer.opacity')).toBe('20');
    });

    it('persists swap state', () => {
      render(
        <VisualQaImageViewer
          designImageUrl="/d.png"
          implImageUrl="/i.png"
          designFigmaUrl={null}
        />
      );
      fireEvent.click(screen.getByRole('tab', { name: 'Overlay' }));
      fireEvent.click(screen.getByRole('button', { name: /swap/i }));
      expect(window.localStorage.getItem('vqa.viewer.topLayer')).toBe('impl');
    });
  });
});
