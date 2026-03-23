"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PromptRenderer } from "@/components/prompt/prompt-renderer";
import { WizardStep } from "./wizard-step";
import { generatePrompt } from "@/lib/prompt-generator";
import { isFieldFilled } from "@/lib/validators";
import { getActiveSkillsForProject } from "@/lib/skill-filter";
import { PRODUCT_CONTEXT_MEMORY_IDS } from "@/hooks/use-shared-memories";
import type { Project, SharedSkill, SharedMemory } from "@/lib/types";

interface StepReviewProps {
  formData: Project;
  sharedSkills: SharedSkill[];
  sharedMemories?: SharedMemory[];
  onCopy: () => void;
  copied: boolean;
}

function countFilledFields(project: Project): number {
  let count = 0;

  // Company info is always filled (locked Boomi Context memory)
  count++;

  // Product info: field data OR a selected product memory
  if (
    isFieldFilled(project.productInfo) ||
    (project.selectedSharedMemoryIds ?? []).some((id) => PRODUCT_CONTEXT_MEMORY_IDS.includes(id))
  ) {
    count++;
  }

  // Remaining fields
  const otherFields = [
    project.featureInfo,
    project.currentImplementation,
    project.uxResearch,
    project.figmaFileLink,
    project.designSystemStorybook,
    project.designSystemNpm,
    project.designSystemFigma,
    project.prototypeSketches,
  ];

  count += otherFields.filter((f) => isFieldFilled(f)).length;

  return count;
}

const INTERACTION_LABELS: Record<string, string> = {
  'static': 'Static Mockups',
  'click-through': 'Click-through Flows',
  'full-prototype': 'Full Prototype',
};

const ACCESSIBILITY_LABELS: Record<string, string> = {
  'none': 'None',
  'wcag-aa': 'WCAG 2.1 AA',
  'wcag-aaa': 'WCAG 2.1 AAA',
};

export function StepReview({
  formData,
  sharedSkills,
  sharedMemories = [],
  onCopy,
  copied,
}: StepReviewProps) {
  const prompt = generatePrompt(formData, sharedSkills, sharedMemories);
  const filledFields = countFilledFields(formData);
  const totalSkills =
    getActiveSkillsForProject(formData).length +
    formData.selectedSharedSkillIds.length +
    formData.customSkills.length;
  const totalMemories =
    (formData.selectedSharedMemoryIds ?? []).length +
    (formData.customMemories ?? []).length;

  return (
    <WizardStep
      title="Review & Generate"
      description="Review your configuration and copy the generated prompt"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Project Name</span>
              <span className="text-sm font-medium">{formData.name || "Untitled"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Filled Fields</span>
              <span className="text-sm font-medium">{filledFields} / 10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Prompt Mode</span>
              <Badge variant="secondary">
                {formData.promptMode === 'lite' ? 'Quick' : 'Comprehensive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Interaction Level</span>
              <Badge variant="secondary">
                {INTERACTION_LABELS[formData.interactionLevel] ?? formData.interactionLevel}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Output Directory</span>
              <span className="text-sm font-medium font-mono">{formData.outputDirectory || './output/'}</span>
            </div>
            {formData.accessibilityLevel !== 'none' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accessibility</span>
                <Badge variant="secondary">
                  {ACCESSIBILITY_LABELS[formData.accessibilityLevel]}
                </Badge>
              </div>
            )}
            {formData.browserCompatibility.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Browsers</span>
                <span className="text-sm font-medium">{formData.browserCompatibility.join(', ')}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Skills</span>
              <span className="text-sm font-medium">{totalSkills}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Selected Memories</span>
              <span className="text-sm font-medium">{totalMemories}</span>
            </div>
          </CardContent>
        </Card>

        <PromptRenderer prompt={prompt} />

        <Button onClick={onCopy} size="lg" className="w-full">
          {copied ? (
            <>
              <Check className="size-4" />
              Copied to Clipboard
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy Prompt
            </>
          )}
        </Button>
      </div>
    </WizardStep>
  );
}
