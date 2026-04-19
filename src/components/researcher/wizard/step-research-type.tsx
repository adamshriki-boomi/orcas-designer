"use client";

import { RESEARCH_TYPE_INFO } from "@/lib/researcher-constants";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search, Lightbulb, ClipboardCheck } from "lucide-react";
import type { ResearchProjectType } from "@/lib/researcher-types";

interface StepResearchTypeProps {
  researchType: ResearchProjectType;
  onResearchTypeChange: (type: ResearchProjectType) => void;
}

const TYPE_ICONS: Record<ResearchProjectType, React.ReactNode> = {
  exploratory: <Search className="size-6 text-blue-500" />,
  generative: <Lightbulb className="size-6 text-amber-500" />,
  evaluative: <ClipboardCheck className="size-6 text-green-500" />,
};

export function StepResearchType({
  researchType,
  onResearchTypeChange,
}: StepResearchTypeProps) {
  const types = Object.entries(RESEARCH_TYPE_INFO) as [
    ResearchProjectType,
    { label: string; description: string },
  ][];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Research Type
        </h2>
        <p className="text-sm text-muted-foreground">
          Select the type of research project you want to run.
        </p>
      </div>

      <div className="grid gap-3">
        {types.map(([key, info]) => {
          const isSelected = researchType === key;
          return (
            <Card
              key={key}
              className={cn(
                "cursor-pointer transition-all duration-150",
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:ring-1 hover:ring-border"
              )}
            >
              <CardContent
                className="flex items-start gap-4"
                onClick={() => onResearchTypeChange(key)}
              >
                <div className="mt-0.5 shrink-0">{TYPE_ICONS[key]}</div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
