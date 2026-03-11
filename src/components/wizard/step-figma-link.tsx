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
      description="Claude will CREATE/WRITE designs to this file. It will NOT read from it. (required)"
    >
      <div className="space-y-3">
        <Label>Figma Destination URL</Label>
        <UrlInput
          value={data.urlValue}
          onChange={(urlValue) => update({ urlValue })}
          placeholder="https://www.figma.com/..."
        />
        <AdditionalContext
          value={data.additionalContext}
          onChange={(additionalContext) => update({ additionalContext })}
        />
      </div>
    </WizardStep>
  );
}
