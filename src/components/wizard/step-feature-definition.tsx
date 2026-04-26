'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { WizardStep } from './wizard-step';
import { cn } from '@/lib/utils';
import { Sparkles, RefreshCw } from 'lucide-react';
import type { FeatureDefinitionData, FeatureMode } from '@/lib/types';

interface StepFeatureDefinitionProps {
  data: FeatureDefinitionData;
  onChange: (data: FeatureDefinitionData) => void;
}

/**
 * Feature Definition step — the top-of-wizard context that tells Claude what
 * we're building AND branches the downstream "Feature Information" step
 * between "new feature" (current-state not required) and "improvement of
 * existing feature" (current-state required).
 */
export function StepFeatureDefinition({ data, onChange }: StepFeatureDefinitionProps) {
  const update = (partial: Partial<FeatureDefinitionData>) => {
    onChange({ ...data, ...partial });
  };

  const MODES: Array<{
    value: FeatureMode;
    label: string;
    description: string;
    Icon: typeof Sparkles;
  }> = [
    {
      value: 'new',
      label: 'New feature',
      description: "Something that doesn't exist yet — greenfield design",
      Icon: Sparkles,
    },
    {
      value: 'improvement',
      label: 'Improvement of existing feature',
      description: 'Redesign or enhance something already in the product',
      Icon: RefreshCw,
    },
  ];

  return (
    <WizardStep
      title="Feature Definition"
      description="Is this a brand-new feature or an improvement of an existing one? Name it and describe it in a sentence or two."
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map((option) => {
              const isSelected = data.mode === option.value;
              const Icon = option.Icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update({ mode: option.value })}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer hover:bg-muted/50',
                    isSelected
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'border-border',
                  )}
                >
                  <Icon className={cn('size-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <Input
            label="Feature name"
            type="text"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Pipeline runs dashboard"
          />
        </section>

        <section className="space-y-2">
          <p className="text-xs text-muted-foreground">
            One or two sentences about what this feature does and why it matters.
          </p>
          <Textarea
            label="Brief description"
            value={data.briefDescription}
            onChange={(e) => update({ briefDescription: e.target.value })}
            placeholder="Give users a single place to see and filter every pipeline run across their workspaces..."
            rows={4}
          />
        </section>
      </div>
    </WizardStep>
  );
}
