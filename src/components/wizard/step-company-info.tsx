"use client";

import { useState } from "react";
import { WizardStep } from "./wizard-step";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, Brain, ChevronDown, ChevronUp } from "lucide-react";
import type { FormFieldData } from "@/lib/types";

interface StepCompanyInfoProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
  builtInContent: string;
}

export function StepCompanyInfo({ data, onChange, builtInContent }: StepCompanyInfoProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <WizardStep
      title="Company Information"
      description="Company context is provided by the built-in memory. Add extra context below."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Company Context Memory</Label>
          <Card size="sm" className="ring-2 ring-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="size-4 shrink-0 text-muted-foreground" />
                <CardTitle className="flex items-center gap-2">
                  <Brain className="size-3.5 text-muted-foreground" />
                  Boomi Context
                  <Badge variant="secondary">Always included</Badge>
                </CardTitle>
              </div>
              <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  {expanded ? "Collapse" : "Preview"}
                </Button>
              </div>
            </CardHeader>
            {expanded && (
              <CardContent className="pt-0">
                <ScrollArea className="h-48 rounded-lg border">
                  <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-muted-foreground">
                    {builtInContent}
                  </pre>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-2">
          <Label>Additional Context</Label>
          <Textarea
            placeholder="Add any extra company context not covered above..."
            value={data.additionalContext}
            onChange={(e) =>
              onChange({ ...data, additionalContext: e.target.value })
            }
            rows={4}
          />
        </div>
      </div>
    </WizardStep>
  );
}
