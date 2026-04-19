"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ResearcherConfig } from "@/lib/researcher-types";

interface StepResearchPurposeProps {
  purpose: ResearcherConfig["researchPurpose"];
  onChange: (purpose: ResearcherConfig["researchPurpose"]) => void;
}

export function StepResearchPurpose({
  purpose,
  onChange,
}: StepResearchPurposeProps) {
  function updateGoal(index: number, value: string) {
    const updated = [...purpose.goals];
    updated[index] = value;
    onChange({ ...purpose, goals: updated });
  }

  function addGoal() {
    onChange({ ...purpose, goals: [...purpose.goals, ""] });
  }

  function removeGoal(index: number) {
    onChange({
      ...purpose,
      goals: purpose.goals.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Research Goals
        </h2>
        <p className="text-sm text-muted-foreground">
          Define the title, description, and goals for this research project.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            placeholder="e.g. Connector UX Evaluation Q4"
            value={purpose.title}
            onChange={(e) => onChange({ ...purpose, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Briefly describe what this research aims to accomplish..."
            value={purpose.description}
            onChange={(e) =>
              onChange({ ...purpose, description: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Goals</Label>
          <div className="space-y-2">
            {purpose.goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Goal ${index + 1}`}
                  value={goal}
                  onChange={(e) => updateGoal(index, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeGoal(index)}
                  className="shrink-0"
                >
                  <X className="size-4 text-muted-foreground" />
                  <span className="sr-only">Remove goal</span>
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addGoal}>
            <Plus className="size-4" />
            Add Goal
          </Button>
        </div>
      </div>
    </div>
  );
}
