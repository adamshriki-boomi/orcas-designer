"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { FigmaLinkInput } from "@/components/fields/figma-link-input";
import { Label } from "@/components/ui/label";
import { WizardStep } from "./wizard-step";
import { cn } from "@/lib/utils";
import { Layers, RefreshCw } from "lucide-react";
import type {
  CurrentImplementationData,
  ImplementationMode,
  FormFieldData,
  FeatureMode,
} from "@/lib/types";

interface StepFeatureInformationProps {
  mode: FeatureMode;
  featureInfo: FormFieldData;
  onFeatureInfoChange: (data: FormFieldData) => void;
  current: CurrentImplementationData;
  onCurrentChange: (data: CurrentImplementationData) => void;
  research: FormFieldData;
  onResearchChange: (data: FormFieldData) => void;
  prototypes: FormFieldData;
  onPrototypesChange: (data: FormFieldData) => void;
}

/**
 * Feature Information step — the context for what we're building:
 * requirements / spec link, current-state reference (required only when
 * mode is 'improvement'), UX research findings, prior prototypes.
 */
export function StepCurrentState({
  mode,
  featureInfo,
  onFeatureInfoChange,
  current,
  onCurrentChange,
  research,
  onResearchChange,
  prototypes,
  onPrototypesChange,
}: StepFeatureInformationProps) {
  const updateCurrent = (partial: Partial<CurrentImplementationData>) => {
    onCurrentChange({ ...current, ...partial });
  };

  const isImprovement = mode === 'improvement';

  return (
    <WizardStep
      title="Feature Information"
      description={
        isImprovement
          ? "What already exists — current state, UX research, and prior prototypes. Current state is required for improvements."
          : "Everything the feature brings with it — requirements, UX research, and any prior prototypes or inspirations."
      }
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold">Feature description / requirements doc</h3>
          <UrlOrFileField
            data={featureInfo}
            onChange={onFeatureInfoChange}
            label="PRD / spec link / free-text description"
            showTextOption
          />
        </section>

        {isImprovement && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold">
              Current state <span className="text-destructive">*</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Point to the existing feature — screenshots, a live URL, or a description.
            </p>
            <UrlOrFileField
              data={current}
              onChange={(fieldData) => updateCurrent(fieldData)}
              label="Screenshots / live URL / notes"
              multiFile
              acceptFiles="image/*"
            />
            <div className="space-y-2">
              <Label>Figma reference files (read-only)</Label>
              <p className="text-xs text-muted-foreground">
                Existing Figma files Claude will READ from for design context, not write to.
              </p>
              <FigmaLinkInput
                links={current.figmaLinks}
                onChange={(figmaLinks) => updateCurrent({ figmaLinks })}
              />
            </div>
            <div className="space-y-2">
              <Label>Implementation mode</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  {
                    value: "add-on-top" as ImplementationMode,
                    label: "Add on top",
                    description: "Overlay new elements on the existing design",
                    icon: Layers,
                  },
                  {
                    value: "redesign" as ImplementationMode,
                    label: "Redesign",
                    description: "Start fresh — current UI is reference only",
                    icon: RefreshCw,
                  },
                ]).map((option) => {
                  const Icon = option.icon;
                  const isSelected = current.implementationMode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateCurrent({ implementationMode: option.value })}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer hover:bg-muted/50",
                        isSelected
                          ? "ring-2 ring-primary border-primary bg-primary/5"
                          : "border-border",
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
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold">UX research findings (optional)</h3>
          <UrlOrFileField
            data={research}
            onChange={onResearchChange}
            label="Research report / insights"
            urlPlaceholder="https://docs.google.com/document/d/..."
            showTextOption
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold">Prior prototypes or wireframes (optional)</h3>
          <UrlOrFileField
            data={prototypes}
            onChange={onPrototypesChange}
            label="Prototype links / wireframe sketches"
            urlPlaceholder="https://www.figma.com/design/..."
            showTextOption
          />
        </section>
      </div>
    </WizardStep>
  );
}
