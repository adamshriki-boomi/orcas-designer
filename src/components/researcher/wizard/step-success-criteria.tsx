"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ResearcherConfig } from "@/lib/researcher-types";

interface StepSuccessCriteriaProps {
  criteria: ResearcherConfig["successCriteria"];
  onChange: (criteria: ResearcherConfig["successCriteria"]) => void;
}

export function StepSuccessCriteria({
  criteria,
  onChange,
}: StepSuccessCriteriaProps) {
  function updateCriterion(
    index: number,
    field: "metric" | "target",
    value: string
  ) {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function addCriterion() {
    onChange([...criteria, { metric: "", target: "" }]);
  }

  function removeCriterion(index: number) {
    onChange(criteria.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Success Criteria
        </h2>
        <p className="text-sm text-muted-foreground">
          Define measurable success criteria for your research. Each criterion has a
          metric and a target value.
        </p>
      </div>

      <div className="space-y-3">
        {criteria.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
              <Label className="text-xs text-muted-foreground">Metric</Label>
              <Label className="text-xs text-muted-foreground">Target</Label>
              <div className="w-7" />
            </div>
            {criteria.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
              >
                <Input
                  placeholder="e.g. Task completion rate"
                  value={item.metric}
                  onChange={(e) =>
                    updateCriterion(index, "metric", e.target.value)
                  }
                />
                <Input
                  placeholder="e.g. > 85%"
                  value={item.target}
                  onChange={(e) =>
                    updateCriterion(index, "target", e.target.value)
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeCriterion(index)}
                  className="shrink-0"
                >
                  <X className="size-4 text-muted-foreground" />
                  <span className="sr-only">Remove criterion</span>
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" size="sm" onClick={addCriterion}>
          <Plus className="size-4" />
          Add Criteria
        </Button>

        {criteria.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No success criteria defined yet. Click &quot;Add Criteria&quot; to get started.
          </p>
        )}
      </div>
    </div>
  );
}
