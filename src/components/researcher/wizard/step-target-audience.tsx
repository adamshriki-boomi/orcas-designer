"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { ResearcherConfig } from "@/lib/researcher-types";

interface StepTargetAudienceProps {
  audience: ResearcherConfig["targetAudience"];
  onChange: (audience: ResearcherConfig["targetAudience"]) => void;
}

export function StepTargetAudience({
  audience,
  onChange,
}: StepTargetAudienceProps) {
  function handleSegmentsChange(value: string) {
    const segments = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({ ...audience, segments });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Target Audience
        </h2>
        <p className="text-sm text-muted-foreground">
          Describe the users you are researching, their segments, and any existing personas.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe the target audience for this research..."
            value={audience.description}
            onChange={(e) =>
              onChange({ ...audience, description: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Segments</Label>
          <Input
            placeholder="e.g. Enterprise admins, Power users, New users (comma-separated)"
            value={audience.segments.join(", ")}
            onChange={(e) => handleSegmentsChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter audience segments separated by commas.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Existing Personas</Label>
          <Textarea
            placeholder="Paste or describe any existing personas relevant to this research..."
            value={audience.existingPersonas}
            onChange={(e) =>
              onChange({ ...audience, existingPersonas: e.target.value })
            }
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
