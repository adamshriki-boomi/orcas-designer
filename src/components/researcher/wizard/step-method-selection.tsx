"use client";

import {
  BUILT_IN_RESEARCH_METHODS,
  getMethodsForProjectType,
} from "@/lib/researcher-constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Footprints,
  Accessibility,
  Network,
  ListChecks,
  BarChart3,
  Users,
  Route,
  GitCompareArrows,
  GitBranch,
  CalendarRange,
  FileText,
  PieChart,
  MessageSquareText,
  FileSearch,
  Info,
} from "lucide-react";
import type { ResearchProjectType } from "@/lib/researcher-types";

interface StepMethodSelectionProps {
  selectedMethodIds: string[];
  researchType: ResearchProjectType;
  onMethodsChange: (ids: string[]) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  ClipboardCheck: <ClipboardCheck className="size-5" />,
  Footprints: <Footprints className="size-5" />,
  Accessibility: <Accessibility className="size-5" />,
  Network: <Network className="size-5" />,
  ListChecks: <ListChecks className="size-5" />,
  BarChart3: <BarChart3 className="size-5" />,
  Users: <Users className="size-5" />,
  Route: <Route className="size-5" />,
  GitCompareArrows: <GitCompareArrows className="size-5" />,
  GitBranch: <GitBranch className="size-5" />,
  CalendarRange: <CalendarRange className="size-5" />,
  FileText: <FileText className="size-5" />,
  PieChart: <PieChart className="size-5" />,
  MessageSquareText: <MessageSquareText className="size-5" />,
  FileSearch: <FileSearch className="size-5" />,
};

export function StepMethodSelection({
  selectedMethodIds,
  researchType,
  onMethodsChange,
}: StepMethodSelectionProps) {
  const recommendedMethods = getMethodsForProjectType(researchType);
  const recommendedIds = new Set(recommendedMethods.map((m) => m.id));
  const otherMethods = BUILT_IN_RESEARCH_METHODS.filter(
    (m) => !recommendedIds.has(m.id)
  );

  const hasAnalyticalSelected = BUILT_IN_RESEARCH_METHODS.some(
    (m) => m.mode === "analytical" && selectedMethodIds.includes(m.id)
  );

  function toggleMethod(id: string) {
    if (selectedMethodIds.includes(id)) {
      onMethodsChange(selectedMethodIds.filter((mid) => mid !== id));
    } else {
      onMethodsChange([...selectedMethodIds, id]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Research Methods
        </h2>
        <p className="text-sm text-muted-foreground">
          Select the research methods to include.{" "}
          <span className="font-medium">
            {selectedMethodIds.length} selected
          </span>
        </p>
      </div>

      <div className="space-y-6">
        {/* Recommended methods */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium">
            Recommended for {researchType.charAt(0).toUpperCase() + researchType.slice(1)} Research
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recommendedMethods.map((method) => {
              const isSelected = selectedMethodIds.includes(method.id);
              return (
                <Card
                  key={method.id}
                  size="sm"
                  className={cn(
                    "cursor-pointer transition-all duration-150",
                    isSelected
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:ring-1 hover:ring-border"
                  )}
                >
                  <CardContent
                    className="space-y-2"
                    onClick={() => toggleMethod(method.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 text-muted-foreground">
                        {ICON_MAP[method.icon] ?? <FileText className="size-5" />}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-tight">
                            {method.name}
                          </p>
                          <Badge
                            variant={
                              method.mode === "generative"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {method.mode}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {method.shortDescription}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Other methods */}
        {otherMethods.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Other Methods</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {otherMethods.map((method) => {
                const isSelected = selectedMethodIds.includes(method.id);
                return (
                  <Card
                    key={method.id}
                    size="sm"
                    className={cn(
                      "cursor-pointer transition-all duration-150",
                      isSelected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:ring-1 hover:ring-border"
                    )}
                  >
                    <CardContent
                      className="space-y-2"
                      onClick={() => toggleMethod(method.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 text-muted-foreground">
                          {ICON_MAP[method.icon] ?? (
                            <FileText className="size-5" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium leading-tight">
                              {method.name}
                            </p>
                            <Badge
                              variant={
                                method.mode === "generative"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {method.mode}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {method.shortDescription}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {hasAnalyticalSelected && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            You selected analytical methods that require uploaded data (interview
            transcripts, survey results, etc.). Make sure to provide data in the
            Data Upload step.
          </p>
        </div>
      )}
    </div>
  );
}
