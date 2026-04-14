'use client';

import { Pencil } from 'lucide-react';
import { FieldSummary } from './field-summary';
import { getMemoryNames } from './field-memory-map';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Prompt, SharedMemory } from '@/lib/types';

interface FieldsGridProps {
  project: Prompt;
  onEditField: (fieldKey: string) => void;
  onEditInteractionLevel?: () => void;
  onEditImplementationMode?: () => void;
  sharedMemories?: SharedMemory[];
}

const FIELD_LABELS: Record<string, string> = {
  companyInfo: 'Company Info',
  productInfo: 'Product Info',
  featureInfo: 'Feature Info',
  uxResearch: 'UX Research',
  uxWriting: 'UX Writing',
  figmaFileLink: 'Figma File',
  designSystemStorybook: 'Storybook',
  designSystemNpm: 'NPM Package',
  designSystemFigma: 'Design System Figma',
  prototypeSketches: 'Prototypes & Sketches',
};

const INTERACTION_LEVEL_LABELS: Record<string, string> = {
  'static': 'Static Mockups',
  'click-through': 'Click-through Flows',
  'full-prototype': 'Full Prototype',
};

const IMPLEMENTATION_MODE_LABELS: Record<string, string> = {
  'add-on-top': 'Add on Top',
  'redesign': 'Redesign',
};

const FIELD_KEYS = [
  'companyInfo',
  'productInfo',
  'featureInfo',
  'uxResearch',
  'uxWriting',
  'figmaFileLink',
  'designSystemStorybook',
  'designSystemNpm',
  'designSystemFigma',
  'prototypeSketches',
] as const;

export function FieldsGrid({ project, onEditField, onEditInteractionLevel, onEditImplementationMode, sharedMemories = [] }: FieldsGridProps) {
  const selectedIds = project.selectedSharedMemoryIds ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELD_KEYS.map((key) => (
          <FieldSummary
            key={key}
            label={FIELD_LABELS[key]}
            field={project[key]}
            onEdit={() => onEditField(key)}
            memoryNames={getMemoryNames(key, selectedIds, sharedMemories)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card
          size="sm"
          className="cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:scale-[1.01]"
          onClick={onEditInteractionLevel}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditInteractionLevel?.(); } }}
          role="button"
          tabIndex={0}
          aria-label="Edit Interaction Level"
        >
          <CardHeader>
            <CardTitle className="text-sm">Interaction Level</CardTitle>
            <CardAction>
              <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onEditInteractionLevel?.(); }}>
                <Pencil className="size-3" />
                <span className="sr-only">Edit Interaction Level</span>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {INTERACTION_LEVEL_LABELS[project.interactionLevel] ?? project.interactionLevel}
            </Badge>
          </CardContent>
        </Card>

        <Card
          size="sm"
          className="cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:scale-[1.01]"
          onClick={onEditImplementationMode}
          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditImplementationMode?.(); } }}
          role="button"
          tabIndex={0}
          aria-label="Edit Implementation Mode"
        >
          <CardHeader>
            <CardTitle className="text-sm">Implementation Mode</CardTitle>
            <CardAction>
              <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onEditImplementationMode?.(); }}>
                <Pencil className="size-3" />
                <span className="sr-only">Edit Implementation Mode</span>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {IMPLEMENTATION_MODE_LABELS[project.currentImplementation.implementationMode] ??
                project.currentImplementation.implementationMode}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
