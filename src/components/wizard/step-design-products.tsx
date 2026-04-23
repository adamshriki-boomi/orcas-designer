'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { WizardStep } from './wizard-step';
import { cn } from '@/lib/utils';
import { isValidFigmaUrl } from '@/lib/validators';
import { Check, LayoutGrid, Film, Paintbrush } from 'lucide-react';
import type { DesignProductsData, DesignProduct } from '@/lib/types';

interface StepDesignProductsProps {
  data: DesignProductsData;
  onChange: (data: DesignProductsData) => void;
}

const PRODUCTS: Array<{
  value: DesignProduct;
  label: string;
  description: string;
  Icon: typeof LayoutGrid;
}> = [
  {
    value: 'wireframe',
    label: 'Wireframe',
    description: 'Lo-fi layout — grayscale, structural, no final visuals',
    Icon: LayoutGrid,
  },
  {
    value: 'mockup',
    label: 'Mockup',
    description: 'Hi-fi mockup — final fidelity with design system',
    Icon: Paintbrush,
  },
  {
    value: 'animated-prototype',
    label: 'Animated prototype',
    description: 'Interactive, clickable with micro-interactions',
    Icon: Film,
  },
];

/**
 * Design Products step — user picks one or more outputs. The generated
 * Claude Code brief will include ONLY the phases the user selected (the
 * system prompt is conditional on this list).
 */
export function StepDesignProducts({ data, onChange }: StepDesignProductsProps) {
  const update = (partial: Partial<DesignProductsData>) => {
    onChange({ ...data, ...partial });
  };

  const toggle = (product: DesignProduct) => {
    const selected = new Set(data.products);
    if (selected.has(product)) {
      selected.delete(product);
    } else {
      selected.add(product);
    }
    update({ products: Array.from(selected) });
  };

  const hasAnyProduct = data.products.length > 0;
  const figmaUrlTrimmed = data.figmaDestinationUrl.trim();
  const figmaUrlInvalid = figmaUrlTrimmed.length > 0 && !isValidFigmaUrl(figmaUrlTrimmed);

  return (
    <WizardStep
      title="Design Products"
      description="Pick one or more outputs Claude should generate. You can optionally point to a Figma file as the destination."
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <Label>Outputs</Label>
          <p className="text-xs text-muted-foreground">
            Select one or more. Each chosen output becomes a phase in the generated brief.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRODUCTS.map((option) => {
              const isSelected = data.products.includes(option.value);
              const Icon = option.Icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  aria-pressed={isSelected}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer hover:bg-muted/50',
                    isSelected
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'border-border',
                  )}
                >
                  {isSelected && (
                    <span
                      className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      aria-hidden
                    >
                      <Check className="size-3" />
                    </span>
                  )}
                  <Icon className={cn('size-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {!hasAnyProduct && (
            <p className="text-xs text-destructive">
              Pick at least one output to continue.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <Label htmlFor="figma-destination">Figma destination (optional)</Label>
          <p className="text-xs text-muted-foreground">
            If you want the output built directly in Figma, paste the destination file URL here.
            Only <code className="text-[0.7rem]">figma.com</code> / <code className="text-[0.7rem]">www.figma.com</code> links are accepted.
          </p>
          <Input
            id="figma-destination"
            type="url"
            value={data.figmaDestinationUrl}
            onChange={(e) => update({ figmaDestinationUrl: e.target.value })}
            placeholder="https://www.figma.com/design/..."
            aria-invalid={figmaUrlInvalid || undefined}
          />
          {figmaUrlInvalid && (
            <p className="text-xs text-destructive">
              Enter a valid Figma URL (must be on figma.com).
            </p>
          )}
        </section>
      </div>
    </WizardStep>
  );
}
