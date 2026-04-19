"use client";

import { useMemo } from "react";
import { RESEARCH_TYPE_INFO, getMethodById } from "@/lib/researcher-constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  ResearcherConfig,
  ResearchProjectType,
} from "@/lib/researcher-types";
import type { FormFieldData } from "@/lib/types";

interface StepReviewRunProps {
  researchType: ResearchProjectType;
  config: ResearcherConfig;
  selectedMethodIds: string[];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

/** Extract a displayable string from a FormFieldData object. */
function extractFieldText(field: FormFieldData): string {
  if (field.inputType === "text" && field.textValue) return field.textValue;
  if (field.inputType === "url" && field.urlValue) return field.urlValue;
  if (field.inputType === "file" && field.files?.length > 0) {
    return `[${field.files.length} file${field.files.length > 1 ? "s" : ""}: ${field.files.map((f) => f.name).join(", ")}]`;
  }
  return field.textValue || field.urlValue || "";
}

function buildFramingPreview(
  researchType: ResearchProjectType,
  config: ResearcherConfig,
  selectedMethodIds: string[]
): string {
  const typeInfo = RESEARCH_TYPE_INFO[researchType];
  const lines: string[] = [];

  lines.push(`# Research Framing Document`);
  lines.push("");

  lines.push(`## Research Type`);
  lines.push(`**${typeInfo.label}** - ${typeInfo.description}`);
  lines.push("");

  if (config.researchPurpose.title) {
    lines.push(`## ${config.researchPurpose.title}`);
    if (config.researchPurpose.description) {
      lines.push(config.researchPurpose.description);
    }
    lines.push("");
  }

  if (config.researchPurpose.goals.length > 0) {
    lines.push(`## Goals`);
    config.researchPurpose.goals.forEach((goal, i) => {
      if (goal.trim()) {
        lines.push(`${i + 1}. ${goal}`);
      }
    });
    lines.push("");
  }

  const companyText = config.productContext.companyAdditionalContext;
  const productText = extractFieldText(config.productContext.productInfo);
  const featureText = extractFieldText(config.productContext.featureInfo);

  if (companyText || productText || featureText) {
    lines.push(`## Product Context`);
    if (companyText) {
      lines.push(`### Company`);
      lines.push(companyText);
      lines.push("");
    }
    if (productText) {
      lines.push(`### Product`);
      lines.push(productText);
      lines.push("");
    }
    if (featureText) {
      lines.push(`### Feature`);
      lines.push(featureText);
      lines.push("");
    }
  }

  if (config.targetAudience.description || config.targetAudience.segments.length > 0) {
    lines.push(`## Target Audience`);
    if (config.targetAudience.description) {
      lines.push(config.targetAudience.description);
      lines.push("");
    }
    if (config.targetAudience.segments.length > 0) {
      lines.push(`**Segments:** ${config.targetAudience.segments.join(", ")}`);
      lines.push("");
    }
  }

  if (selectedMethodIds.length > 0) {
    lines.push(`## Selected Methods`);
    selectedMethodIds.forEach((id) => {
      const method = getMethodById(id);
      if (method) {
        lines.push(`- **${method.name}** (${method.mode}) - ${method.shortDescription}`);
      }
    });
    lines.push("");
  }

  if (config.successCriteria.length > 0) {
    lines.push(`## Success Criteria`);
    config.successCriteria.forEach((c) => {
      if (c.metric.trim()) {
        lines.push(`- **${c.metric}**: ${c.target || "Not set"}`);
      }
    });
    lines.push("");
  }

  return lines.join("\n");
}

export function StepReviewRun({
  researchType,
  config,
  selectedMethodIds,
}: StepReviewRunProps) {
  const typeInfo = RESEARCH_TYPE_INFO[researchType];

  const methods = useMemo(
    () =>
      selectedMethodIds
        .map((id) => getMethodById(id))
        .filter(Boolean),
    [selectedMethodIds]
  );

  const framingPreview = useMemo(
    () => buildFramingPreview(researchType, config, selectedMethodIds),
    [researchType, config, selectedMethodIds]
  );

  const filledGoals = config.researchPurpose.goals.filter((g) => g.trim());
  const filledCriteria = config.successCriteria.filter((c) => c.metric.trim());

  const hasTextData = config.dataUpload.textData.trim().length > 0;
  const fileCount = config.dataUpload.files.length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Review & Run
        </h2>
        <p className="text-sm text-muted-foreground">
          Review your research configuration before running.
        </p>
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Research Type</span>
            <Badge>{typeInfo.label}</Badge>
          </div>

          {config.researchPurpose.title && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Title</span>
              <span className="text-sm font-medium">
                {config.researchPurpose.title}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Product Context
            </span>
            <span className="max-w-64 truncate text-sm font-medium">
              {config.productContext.companyAdditionalContext
                ? truncate(config.productContext.companyAdditionalContext, 40)
                : "Not provided"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Goals</span>
            <span className="text-sm font-medium">
              {filledGoals.length > 0 ? `${filledGoals.length} defined` : "None"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Target Audience
            </span>
            <span className="max-w-64 truncate text-sm font-medium">
              {config.targetAudience.description
                ? truncate(config.targetAudience.description, 40)
                : "Not provided"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Success Criteria
            </span>
            <span className="text-sm font-medium">
              {filledCriteria.length > 0
                ? `${filledCriteria.length} defined`
                : "None"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Selected Methods
            </span>
            <span className="text-sm font-medium">{methods.length}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Data Upload</span>
            <span className="text-sm font-medium">
              {fileCount > 0 || hasTextData
                ? [
                    fileCount > 0 && `${fileCount} file${fileCount > 1 ? "s" : ""}`,
                    hasTextData && "text data",
                  ]
                    .filter(Boolean)
                    .join(" + ")
                : "None"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Selected methods */}
      {methods.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selected Methods</h3>
          <div className="flex flex-wrap gap-1.5">
            {methods.map((method) => (
              <Badge key={method!.id} variant="secondary">
                {method!.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Goals summary */}
      {filledGoals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Goals</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {filledGoals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success criteria summary */}
      {filledCriteria.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Success Criteria</h3>
          <div className="space-y-1">
            {filledCriteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{c.metric}</span>
                <span className="text-muted-foreground">{c.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Framing document preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Framing Document Preview</h3>
        <ScrollArea className="h-64 rounded-lg border">
          <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-muted-foreground">
            {framingPreview}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}
