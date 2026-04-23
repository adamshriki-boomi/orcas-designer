"use client";

import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, Package } from "lucide-react";
import type { FormFieldData } from "@/lib/types";

interface StepDesignSystemProps {
  figmaTarget: FormFieldData;
  onFigmaTargetChange: (data: FormFieldData) => void;
  storybook: FormFieldData;
  onStorybookChange: (data: FormFieldData) => void;
  npmPackage: FormFieldData;
  onNpmPackageChange: (data: FormFieldData) => void;
  referenceFigma: FormFieldData;
  onReferenceFigmaChange: (data: FormFieldData) => void;
}

/**
 * Design System step. Exosphere is always attached via the `/exosphere`
 * MANDATORY_SKILL — surfaced as a locked card so users can see it. The four
 * freeform fields (Figma destination, Storybook, npm package, reference
 * Figma) are all optional extras.
 */
export function StepDesignSystem({
  figmaTarget,
  onFigmaTargetChange,
  storybook,
  onStorybookChange,
  npmPackage,
  onNpmPackageChange,
  referenceFigma,
  onReferenceFigmaChange,
}: StepDesignSystemProps) {
  return (
    <WizardStep
      title="Design System"
      description="Boomi's Exosphere design system is always attached as a Claude Code skill. Add extra design-system context below if you need to."
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Design system</h3>
          <Card size="sm" className="ring-2 ring-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-3.5 text-muted-foreground" />
                  Exosphere
                  <Badge variant="secondary">Always included</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Official Boomi Exosphere Claude skill — 80 indexed components, design tokens,
                patterns, and content guidelines. Claude Code invokes it directly on any
                Ex* identifier or <code className="text-[0.65rem]">@boomi/exosphere</code> import.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-2">
          <UrlOrFileField
            data={storybook}
            onChange={onStorybookChange}
            label="Storybook URL (optional)"
            urlPlaceholder="https://exosphere.boomi.com/"
          />
          <p className="text-xs text-muted-foreground">
            Point Claude at a specific Storybook if it's not the default Exosphere site.
          </p>
        </section>

        <section>
          <UrlOrFileField
            data={npmPackage}
            onChange={onNpmPackageChange}
            label="NPM package (optional)"
            urlPlaceholder="@boomi/exosphere"
            showTextOption
          />
        </section>

        <section>
          <UrlOrFileField
            data={referenceFigma}
            onChange={onReferenceFigmaChange}
            label="Reference Figma (read-only, optional)"
            urlPlaceholder="https://www.figma.com/design/..."
          />
        </section>

        <section className="space-y-2">
          <UrlOrFileField
            data={figmaTarget}
            onChange={onFigmaTargetChange}
            label="Target Figma file (write destination, optional)"
            urlPlaceholder="https://www.figma.com/design/..."
          />
          <p className="text-xs text-muted-foreground">
            If set, Claude Code can push hi-fi mockups back to Figma via the Figma plugin.
          </p>
        </section>
      </div>
    </WizardStep>
  );
}
