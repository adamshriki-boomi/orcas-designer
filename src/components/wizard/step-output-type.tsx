"use client";

import { Image, MousePointer, Play, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardStep } from "./wizard-step";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InteractionLevel, PromptMode } from "@/lib/types";

interface StepOutputTypeProps {
  interactionLevel: InteractionLevel;
  onInteractionLevelChange: (value: InteractionLevel) => void;
  outputDirectory: string;
  onOutputDirectoryChange: (value: string) => void;
  promptMode: PromptMode;
  onPromptModeChange: (value: PromptMode) => void;
}

const PROMPT_MODE_OPTIONS: {
  value: PromptMode;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "lite",
    label: "Quick",
    description: "Core flows only, desktop only, streamlined prompt",
    icon: Zap,
  },
  {
    value: "comprehensive",
    label: "Comprehensive",
    description:
      "Full user stories, all states, responsive, CLAUDE.md",
    icon: BookOpen,
  },
];

const INTERACTION_OPTIONS: {
  value: InteractionLevel;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "static",
    label: "Static Mockups",
    description: "HTML/CSS only, no JavaScript interactions",
    icon: Image,
  },
  {
    value: "click-through",
    label: "Click-through Flows",
    description: "Basic navigation JS, page-to-page flows",
    icon: MousePointer,
  },
  {
    value: "full-prototype",
    label: "Full Prototype",
    description:
      "Animations, transitions, micro-interactions",
    icon: Play,
  },
];

export function StepOutputType({
  interactionLevel,
  onInteractionLevelChange,
  outputDirectory,
  onOutputDirectoryChange,
  promptMode,
  onPromptModeChange,
}: StepOutputTypeProps) {
  return (
    <WizardStep
      title="Output Type"
      description="Choose the prompt mode and interaction level"
    >
      <div className="space-y-8">
        {/* Prompt Mode */}
        <div className="space-y-3">
          <Label>Prompt Mode</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PROMPT_MODE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = promptMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onPromptModeChange(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all cursor-pointer hover:bg-muted/50",
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <Icon className={cn("size-8", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interaction Level */}
        <div className="space-y-3">
          <Label>Interaction Level</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {INTERACTION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = interactionLevel === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onInteractionLevelChange(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all cursor-pointer hover:bg-muted/50",
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <Icon className={cn("size-8", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Output Directory */}
        <div className="space-y-2">
          <Input
            label="Output Directory"
            type="text"
            value={outputDirectory}
            onChange={(e) => onOutputDirectoryChange(e.target.value)}
            placeholder="./output/"
          />
          <p className="text-xs text-muted-foreground">
            Where generated prototype files will be saved
          </p>
        </div>
      </div>
    </WizardStep>
  );
}
