"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { WizardStep } from "./wizard-step";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  AccessibilityLevel,
  BrowserTarget,
  DesignDirection,
} from "@/lib/types";

interface StepAdvancedOptionsProps {
  accessibilityLevel: AccessibilityLevel;
  onAccessibilityLevelChange: (level: AccessibilityLevel) => void;
  browserCompatibility: BrowserTarget[];
  onBrowserCompatChange: (browsers: BrowserTarget[]) => void;
  externalResourcesAccessible: boolean;
  onExternalResourcesChange: (accessible: boolean) => void;
  designDirection: DesignDirection | null;
  onDesignDirectionChange: (dd: DesignDirection | null) => void;
}

const ACCESSIBILITY_OPTIONS: {
  value: AccessibilityLevel;
  label: string;
  description: string;
}[] = [
  { value: "none", label: "None", description: "No specific accessibility requirements" },
  { value: "wcag-aa", label: "WCAG 2.1 AA", description: "Standard compliance — ARIA, keyboard nav, contrast" },
  { value: "wcag-aaa", label: "WCAG 2.1 AAA", description: "Highest compliance — enhanced contrast, extended guidelines" },
];

const BROWSER_OPTIONS: { value: BrowserTarget; label: string }[] = [
  { value: "chrome", label: "Chrome" },
  { value: "firefox", label: "Firefox" },
  { value: "safari", label: "Safari" },
  { value: "edge", label: "Edge" },
];

const MOTION_OPTIONS: { value: DesignDirection["motionStyle"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "expressive", label: "Expressive" },
];

const RADIUS_OPTIONS: { value: DesignDirection["borderRadiusStyle"]; label: string }[] = [
  { value: "sharp", label: "Sharp" },
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
];

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

const DEFAULT_DESIGN_DIRECTION: DesignDirection = {
  primaryColor: "",
  fontFamily: "",
  motionStyle: "none",
  borderRadiusStyle: "sharp",
};

export function StepAdvancedOptions({
  accessibilityLevel,
  onAccessibilityLevelChange,
  browserCompatibility,
  onBrowserCompatChange,
  externalResourcesAccessible,
  onExternalResourcesChange,
  designDirection,
  onDesignDirectionChange,
}: StepAdvancedOptionsProps) {
  const dd = designDirection ?? DEFAULT_DESIGN_DIRECTION;

  function updateDesignDirection(partial: Partial<DesignDirection>) {
    onDesignDirectionChange({ ...dd, ...partial });
  }

  function toggleBrowser(browser: BrowserTarget) {
    if (browserCompatibility.includes(browser)) {
      const updated = browserCompatibility.filter((b) => b !== browser);
      onBrowserCompatChange(updated.length > 0 ? updated : ["chrome"]);
    } else {
      onBrowserCompatChange([...browserCompatibility, browser]);
    }
  }

  return (
    <WizardStep
      title="Advanced Options"
      description="Optional configuration for accessibility, browser targets, and design direction"
    >
      <div className="space-y-4">
        {/* Accessibility */}
        <CollapsibleSection title="Accessibility" defaultOpen={accessibilityLevel !== "none"}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ACCESSIBILITY_OPTIONS.map((option) => {
              const isSelected = accessibilityLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onAccessibilityLevelChange(option.value)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-4 text-left transition-all cursor-pointer hover:bg-muted/50",
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* Browser Compatibility */}
        <CollapsibleSection title="Browser Compatibility" defaultOpen={browserCompatibility.length > 1}>
          <div className="flex flex-wrap gap-4">
            {BROWSER_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={browserCompatibility.includes(option.value)}
                  onCheckedChange={() => toggleBrowser(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        {/* External Resources */}
        <CollapsibleSection title="External Resources" defaultOpen={!externalResourcesAccessible}>
          <div className="flex items-center gap-3">
            <Switch
              checked={externalResourcesAccessible}
              onCheckedChange={onExternalResourcesChange}
              id="external-resources"
            />
            <Label htmlFor="external-resources">
              Are external URLs publicly accessible?
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Turn off if Figma, Confluence, or Storybook URLs require login
          </p>
        </CollapsibleSection>

        {/* Design Direction */}
        <CollapsibleSection title="Design Direction" defaultOpen={designDirection !== null}>
          <div className="space-y-4">
            <Input
              label="Primary Brand Color"
              type="text"
              value={dd.primaryColor}
              onChange={(e) => updateDesignDirection({ primaryColor: e.target.value })}
              placeholder="#3B82F6"
            />

            <Input
              label="Font Family"
              type="text"
              value={dd.fontFamily}
              onChange={(e) => updateDesignDirection({ fontFamily: e.target.value })}
              placeholder="e.g., Inter, Poppins"
            />

            <div className="space-y-2">
              <Label>Motion Style</Label>
              <div className="flex gap-3">
                {MOTION_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={dd.motionStyle === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateDesignDirection({ motionStyle: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Border Radius</Label>
              <div className="flex gap-3">
                {RADIUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={dd.borderRadiusStyle === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateDesignDirection({ borderRadiusStyle: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </WizardStep>
  );
}
