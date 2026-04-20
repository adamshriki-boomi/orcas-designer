"use client";

import { useState } from "react";
import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormFieldData, SharedMemory } from "@/lib/types";

interface StepDesignSystemProps {
  figmaTarget: FormFieldData;
  onFigmaTargetChange: (data: FormFieldData) => void;
  storybook: FormFieldData;
  onStorybookChange: (data: FormFieldData) => void;
  npmPackage: FormFieldData;
  onNpmPackageChange: (data: FormFieldData) => void;
  referenceFigma: FormFieldData;
  onReferenceFigmaChange: (data: FormFieldData) => void;
  storybookMemories: SharedMemory[];
  selectedMemoryIds: string[];
  onSelectedMemoryIdsChange: (ids: string[]) => void;
}

/**
 * Merged "Design System" step. Covers the four previously-separate design
 * system fields (Figma destination, Storybook, npm, reference Figma) plus the
 * built-in Exosphere Storybook memory so users can opt in with one click.
 */
export function StepDesignSystem({
  figmaTarget,
  onFigmaTargetChange,
  storybook,
  onStorybookChange,
  npmPackage,
  onNpmPackageChange,
  referenceFigma,
  onReferenceFigmaChange,
  storybookMemories,
  selectedMemoryIds,
  onSelectedMemoryIdsChange,
}: StepDesignSystemProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleMemory(id: string) {
    if (selectedMemoryIds.includes(id)) {
      onSelectedMemoryIdsChange(selectedMemoryIds.filter((mid) => mid !== id));
    } else {
      onSelectedMemoryIdsChange([...selectedMemoryIds, id]);
    }
  }

  return (
    <WizardStep
      title="Design System"
      description="Tell Claude Code where the design system lives so hi-fi mockups use the right components."
    >
      <div className="space-y-8">
        {storybookMemories.length > 0 && (
          <section className="space-y-2">
            <Label>Design system memories</Label>
            <div className="grid gap-2">
              {storybookMemories.map((memory) => {
                const isSelected = selectedMemoryIds.includes(memory.id);
                const isExpanded = expandedId === memory.id;
                return (
                  <Card
                    key={memory.id}
                    size="sm"
                    className={cn("transition-all duration-150", isSelected && "ring-2 ring-primary")}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMemory(memory.id)}
                        />
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="size-3.5 text-muted-foreground" />
                          {memory.name}
                          <Badge variant="secondary">Built-in</Badge>
                        </CardTitle>
                      </div>
                      <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : memory.id)}
                          className="cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          {isExpanded ? "Collapse" : "Preview"}
                        </Button>
                      </div>
                    </CardHeader>
                    {memory.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">{memory.description}</p>
                      </CardContent>
                    )}
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <ScrollArea className="h-48 rounded-lg border">
                          <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-muted-foreground">
                            {memory.content}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <UrlOrFileField
            data={storybook}
            onChange={onStorybookChange}
            label="Storybook URL"
            urlPlaceholder="https://storybook.example.com"
          />
          <p className="text-xs text-muted-foreground">
            Claude will browse Storybook to discover the real component API before coding.
          </p>
        </section>

        <section>
          <UrlOrFileField
            data={npmPackage}
            onChange={onNpmPackageChange}
            label="NPM package"
            urlPlaceholder="@boomi/exosphere"
            showTextOption
          />
        </section>

        <section>
          <UrlOrFileField
            data={referenceFigma}
            onChange={onReferenceFigmaChange}
            label="Reference Figma (read-only)"
            urlPlaceholder="https://www.figma.com/design/..."
          />
        </section>

        <section className="space-y-2">
          <UrlOrFileField
            data={figmaTarget}
            onChange={onFigmaTargetChange}
            label="Target Figma file (write destination, optional)"
            urlPlaceholder="https://www.figma.com/design/..."
          />
          <p className="text-xs text-muted-foreground">
            If set, Claude Code can push hi-fi mockups back to Figma via the Figma plugin.
          </p>
        </section>
      </div>
    </WizardStep>
  );
}
