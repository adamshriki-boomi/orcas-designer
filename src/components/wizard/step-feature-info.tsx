"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import type { FormFieldData } from "@/lib/types";

interface StepFeatureInfoProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepFeatureInfo({ data, onChange }: StepFeatureInfoProps) {
  return (
    <WizardStep
      title="Feature Details"
      description="Describe the feature to design and develop"
    >
      <div className="space-y-2">
        <UrlOrFileField
          data={data}
          onChange={onChange}
          label="Feature Info"
          urlPlaceholder="https://spec.example.com/feature"
          showTextOption
        />
        <p className="text-xs text-muted-foreground">
          If this URL requires authentication, use file upload or paste the content as text instead.
        </p>
      </div>
    </WizardStep>
  );
}
