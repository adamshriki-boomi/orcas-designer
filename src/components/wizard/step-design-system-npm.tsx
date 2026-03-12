"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UrlInput } from "@/components/fields/url-input";
import { Input } from "@/components/ui/input";
import { AdditionalContext } from "@/components/fields/additional-context";
import { Label } from "@/components/ui/label";
import { WizardStep } from "./wizard-step";
import type { FormFieldData, FieldType } from "@/lib/types";

interface StepDesignSystemNpmProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
}

export function StepDesignSystemNpm({ data, onChange }: StepDesignSystemNpmProps) {
  const activeTab = data.inputType === 'url' ? 'url' : 'text';

  const setTab = (tab: string) => {
    onChange({ ...data, inputType: tab as FieldType });
  };

  return (
    <WizardStep
      title="Design System — NPM Package"
      description="Package install command or NPM URL (optional)"
    >
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="text">Command</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <div className="space-y-1.5">
              <Label>Install Command</Label>
              <Input
                value={data.textValue}
                onChange={(e) => onChange({ ...data, textValue: e.target.value })}
                placeholder="npm install @company/design-system"
              />
            </div>
          </TabsContent>

          <TabsContent value="url">
            <div className="space-y-1.5">
              <Label>Package URL</Label>
              <UrlInput
                value={data.urlValue}
                onChange={(val) => onChange({ ...data, urlValue: val })}
                placeholder="https://www.npmjs.com/package/..."
              />
            </div>
          </TabsContent>
        </Tabs>

        <AdditionalContext
          value={data.additionalContext}
          onChange={(val) => onChange({ ...data, additionalContext: val })}
        />

        <p className="text-xs text-muted-foreground">
          If no package.json exists, Claude will scaffold one automatically.
        </p>
      </div>
    </WizardStep>
  );
}
