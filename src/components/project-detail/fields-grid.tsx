'use client';

import { FieldSummary } from './field-summary';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project, SharedMemory } from '@/lib/types';

interface FieldsGridProps {
  project: Project;
  onEditField: (fieldKey: string) => void;
  sharedMemories?: SharedMemory[];
}

const FIELD_LABELS: Record<string, string> = {
  companyInfo: 'Company Info',
  productInfo: 'Product Info',
  featureInfo: 'Feature Info',
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

export function FieldsGrid({ project, onEditField, sharedMemories = [] }: FieldsGridProps) {
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
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Interaction Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {INTERACTION_LEVEL_LABELS[project.interactionLevel] ?? project.interactionLevel}
            </Badge>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Implementation Mode</CardTitle>
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
