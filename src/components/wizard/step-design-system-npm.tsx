"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import type { FormFieldData } from "@/lib/types";

interface StepDesignSystemNpmProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepDesignSystemNpm({ data, onChange }: StepDesignSystemNpmProps) {
  return (
    <WizardStep
      title="Design System — NPM Package"
      description="Package install command or NPM URL (optional)"
    >
      <div className="space-y-2">
        <UrlOrFileField
          data={data}
          onChange={onChange}
          label="NPM Package"
          urlPlaceholder="npm install @company/design-system"
          showTextOption
        />
        <p className="text-xs text-muted-foreground">
          If no package.json exists, Claude will scaffold one automatically.
        </p>
      </div>
    </WizardStep>
  );
}
