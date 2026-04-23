"use client";

import { WizardStep } from "./wizard-step";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, Package } from "lucide-react";

/**
 * Design System step. Exosphere is the one and only design system for Orcas
 * Designer prompts; it's always attached via the `/exosphere` MANDATORY_SKILL
 * and has no user-editable fields. This step exists so users can see the
 * design system that will ship with every generated brief.
 */
export function StepDesignSystem() {
  return (
    <WizardStep
      title="Design System"
      description="Boomi's Exosphere design system is always attached as a Claude Code skill. Claude will pick the right Ex* component, use --exo-* tokens, and follow the shipped patterns automatically."
    >
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
    </WizardStep>
  );
}
