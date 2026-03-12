"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AdditionalContextProps {
  value: string;
  onChange: (value: string) => void;
}

export function AdditionalContext({ value, onChange }: AdditionalContextProps) {
  return (
    <div className="space-y-1.5">
      <Label>Additional Context (optional)</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add any extra context or notes..."
        rows={3}
      />
    </div>
  );
}
