"use client";

import { Lightbulb } from "lucide-react";
import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import { Card, CardContent } from "@/components/ui/card";
import type { FormFieldData } from "@/lib/types";

interface StepUxResearchProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepUxResearch({ data, onChange }: StepUxResearchProps) {
  return (
    <WizardStep
      title="UX Research"
      description="Attach UX research documents to inform design decisions"
    >
      <UrlOrFileField
        data={data}
        onChange={onChange}
        label="UX Research"
        urlPlaceholder="https://docs.google.com/document/d/..."
        acceptFiles=".pdf,.doc,.docx,.pptx,.png,.jpg,.jpeg"
        multiFile
        showTextOption
      />

      <Card className="mt-6 border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/20">
        <CardContent className="flex gap-3 text-sm">
          <Lightbulb className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-2 text-muted-foreground">
            <p className="font-medium text-foreground">Tips for sharing research</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Google Docs/Slides</strong>: Set sharing to &quot;Anyone with the link can view&quot; for best results.
              </li>
              <li>
                <strong>Private docs</strong>: Export as PDF and upload, or paste key findings in the Text tab.
              </li>
              <li>
                <strong>What to include</strong>: Personas, journey maps, usability findings, pain points, design recommendations.
              </li>
              <li>
                <strong>Multiple sources</strong>: Paste the primary URL above and add additional links in &quot;Additional context&quot;.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </WizardStep>
  );
}
