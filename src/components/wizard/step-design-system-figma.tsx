"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import type { FormFieldData } from "@/lib/types";

interface StepDesignSystemFigmaProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepDesignSystemFigma({ data, onChange }: StepDesignSystemFigmaProps) {
  return (
    <WizardStep
      title="Design System — Figma"
      description="Figma file for the design system"
    >
      <UrlOrFileField
        data={data}
        onChange={onChange}
        label="Design System Figma URL"
        urlPlaceholder="https://figma.com/design/..."
        showTextOption={false}
      />
    </WizardStep>
  );
}
