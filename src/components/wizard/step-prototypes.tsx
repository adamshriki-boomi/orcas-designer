"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import type { FormFieldData } from "@/lib/types";

interface StepPrototypesProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepPrototypes({ data, onChange }: StepPrototypesProps) {
  return (
    <WizardStep
      title="Prototypes & Sketches"
      description="Existing prototypes or hand-drawn sketches (optional)"
    >
      <UrlOrFileField
        data={data}
        onChange={onChange}
        label="Prototypes"
        urlPlaceholder="https://prototype.example.com"
        acceptFiles="image/*"
        multiFile
        showTextOption
      />
    </WizardStep>
  );
}
