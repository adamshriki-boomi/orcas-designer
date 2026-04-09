"use client";

import { UrlInput } from "@/components/fields/url-input";
import { AdditionalContext } from "@/components/fields/additional-context";
import { Label } from "@/components/ui/label";
import { WizardStep } from "./wizard-step";
import type { FormFieldData } from "@/lib/types";

interface StepFigmaLinkProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepFigmaLink({ data, onChange }: StepFigmaLinkProps) {
  const update = (partial: Partial<FormFieldData>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <WizardStep
      title="Figma Destination File"
      description="Claude will CREATE/WRITE designs to this file. It will NOT read from it."
    >
      <div className="space-y-3">
        <Label>Figma Destination URL</Label>
        <UrlInput
          value={data.urlValue}
          onChange={(urlValue) => update({ urlValue })}
          placeholder="https://www.figma.com/..."
        />
        <p className="text-sm text-[var(--exo-color-text-secondary)]">
          {data.urlValue.trim()
            ? 'Claude will install the "Claude-to-Figma" plugin, authenticate with Figma, and write design mockups to this file alongside the HTML prototypes. Requires Figma authentication.'
            : 'If left empty, Claude will create only live HTML/CSS/JS prototypes without Figma design mockups.'}
        </p>
        <AdditionalContext
          value={data.additionalContext}
          onChange={(additionalContext) => update({ additionalContext })}
        />
      </div>
    </WizardStep>
  );
}
