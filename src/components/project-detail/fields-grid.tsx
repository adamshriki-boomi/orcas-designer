'use client';

import { Pencil } from 'lucide-react';
import { FieldSummary } from './field-summary';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project, SharedMemory } from '@/lib/types';

interface FieldsGridProps {
  project: Project;
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
  'figmaFileLink',
  'designSystemStorybook',
  'designSystemNpm',
  'designSystemFigma',
  'prototypeSketches',
] as const;

// Memories always shown for a field (locked, not toggleable)
const LOCKED_MEMORY_MAP: Record<string, string[]> = {
  companyInfo: ['built-in-company-context'],
};

// Memories shown only when selected
const SELECTABLE_MEMORY_MAP: Record<string, string[]> = {
  productInfo: ['built-in-rivery-context'],
};

export function FieldsGrid({ project, onEditField, onEditInteractionLevel, onEditImplementationMode, sharedMemories = [] }: FieldsGridProps) {
  function getMemoryNames(fieldKey: string): string[] {
    const names: string[] = [];
    const lockedIds = LOCKED_MEMORY_MAP[fieldKey] ?? [];
    for (const id of lockedIds) {
      const name = sharedMemories.find((m) => m.id === id)?.name;
      if (name) names.push(name);
    }
    const selectableIds = SELECTABLE_MEMORY_MAP[fieldKey] ?? [];
    const selectedIds = project.selectedSharedMemoryIds ?? [];
    for (const id of selectableIds) {
      if (selectedIds.includes(id)) {
        const name = sharedMemories.find((m) => m.id === id)?.name;
        if (name) names.push(name);
      }
    }
    return names;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIELD_KEYS.map((key) => (
          <FieldSummary
            key={key}
            label={FIELD_LABELS[key]}
            field={project[key]}
            onEdit={() => onEditField(key)}
            memoryNames={getMemoryNames(key)}
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
