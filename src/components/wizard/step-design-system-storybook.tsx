"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import type { FormFieldData } from "@/lib/types";

interface StepDesignSystemStorybookProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepDesignSystemStorybook({
  data,
  onChange,
}: StepDesignSystemStorybookProps) {
  return (
    <WizardStep
      title="Design System — Storybook"
      description="Link to your component Storybook (optional)"
    >
      <div className="space-y-2">
        <UrlOrFileField
          data={data}
          onChange={onChange}
          label="Storybook URL"
          urlPlaceholder="https://storybook.example.com"
        />
        <p className="text-xs text-muted-foreground">
          If Storybook requires login, provide screenshots or documentation files instead.
        </p>
      </div>
    </WizardStep>
  );
}
