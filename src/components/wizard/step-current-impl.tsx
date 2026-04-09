"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { FigmaLinkInput } from "@/components/fields/figma-link-input";
import { Label } from "@/components/ui/label";
import { WizardStep } from "./wizard-step";
import { cn } from "@/lib/utils";
import { Layers, RefreshCw } from "lucide-react";
import type { CurrentImplementationData, ImplementationMode } from "@/lib/types";

interface StepCurrentImplProps {
  data: CurrentImplementationData;
  onChange: (data: CurrentImplementationData) => void;
}

export function StepCurrentImpl({ data, onChange }: StepCurrentImplProps) {
  const update = (partial: Partial<CurrentImplementationData>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <WizardStep
      title="Current Implementation"
      description="Screenshots and references of the existing UI"
    >
      <div className="space-y-6">
        <UrlOrFileField
          data={data}
          onChange={(fieldData) => update(fieldData)}
          label="Screenshots / Reference"
          multiFile
          acceptFiles="image/*"
        />

        <div className="space-y-2">
          <Label>Figma Reference Files (source — Claude reads from these)</Label>
          <p className="text-xs text-muted-foreground">
            These are existing Figma files Claude will READ from for design context, not write to.
          </p>
          <FigmaLinkInput
            links={data.figmaLinks}
            onChange={(figmaLinks) => update({ figmaLinks })}
          />
        </div>

        <div className="space-y-2">
          <Label>Implementation Mode</Label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "add-on-top" as ImplementationMode, label: "Add on Top", description: "Overlay new elements on the existing design", icon: Layers },
              { value: "redesign" as ImplementationMode, label: "Redesign", description: "Start fresh — current UI is for reference only", icon: RefreshCw },
            ]).map((option) => {
              const Icon = option.icon;
              const isSelected = data.implementationMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update({ implementationMode: option.value })}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer hover:bg-muted/50",
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <Icon className={cn("size-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
