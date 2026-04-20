"use client";

import { useState } from "react";
import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormFieldData, SharedMemory } from "@/lib/types";

interface StepVoiceWritingProps {
  data: FormFieldData;
  onChange: (data: FormFieldData) => void;
  voiceMemories: SharedMemory[];
  selectedMemoryIds: string[];
  onSelectedMemoryIdsChange: (ids: string[]) => void;
}

/**
 * Voice & Writing step. Replaces the UX Writing step. Surfaces the UX Writing
 * and AI Voice built-in memories so the AI has concrete guidance about tone,
 * not just an abstract "be clear" instruction.
 */
export function StepVoiceWriting({
  data,
  onChange,
  voiceMemories,
  selectedMemoryIds,
  onSelectedMemoryIdsChange,
}: StepVoiceWritingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleMemory(id: string) {
    if (selectedMemoryIds.includes(id)) {
      onSelectedMemoryIdsChange(selectedMemoryIds.filter((mid) => mid !== id));
    } else {
      onSelectedMemoryIdsChange([...selectedMemoryIds, id]);
    }
  }

  return (
    <WizardStep
      title="Voice & Writing"
      description="Tone, voice, and microcopy rules. Built-in memories cover most projects; add specifics below."
    >
      <div className="space-y-6">
        {voiceMemories.length > 0 && (
          <section className="space-y-2">
            <Label>Voice memories</Label>
            <div className="grid gap-2">
              {voiceMemories.map((memory) => {
                const isSelected = selectedMemoryIds.includes(memory.id);
                const isExpanded = expandedId === memory.id;
                return (
                  <Card
                    key={memory.id}
                    size="sm"
                    className={cn("transition-all duration-150", isSelected && "ring-2 ring-primary")}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMemory(memory.id)}
                        />
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="size-3.5 text-muted-foreground" />
                          {memory.name}
                          <Badge variant="secondary">Built-in</Badge>
                        </CardTitle>
                      </div>
                      <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : memory.id)}
                          className="cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          {isExpanded ? "Collapse" : "Preview"}
                        </Button>
                      </div>
                    </CardHeader>
                    {memory.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">{memory.description}</p>
                      </CardContent>
                    )}
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <ScrollArea className="h-48 rounded-lg border">
                          <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-muted-foreground">
                            {memory.content}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <UrlOrFileField
          data={data}
          onChange={onChange}
          label="Custom voice / microcopy guidelines (optional)"
          urlPlaceholder="https://docs.example.com/voice"
          showTextOption
        />
      </div>
    </WizardStep>
  );
}
