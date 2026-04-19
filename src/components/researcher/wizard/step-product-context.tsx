"use client";

import { useState } from "react";
import { WizardStep } from "@/components/wizard/wizard-step";
import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Lock, Brain, ChevronDown, ChevronUp } from "lucide-react";
import type { FormFieldData, SharedMemory } from "@/lib/types";
import type { ResearcherConfig } from "@/lib/researcher-types";

interface StepProductContextProps {
  productContext: ResearcherConfig["productContext"];
  onChange: (ctx: ResearcherConfig["productContext"]) => void;
  builtInCompanyContent: string;
  productMemories: SharedMemory[];
  selectedProductMemoryIds: string[];
  onSelectedProductMemoryIdsChange: (ids: string[]) => void;
}

export function StepProductContext({
  productContext,
  onChange,
  builtInCompanyContent,
  productMemories,
  selectedProductMemoryIds,
  onSelectedProductMemoryIdsChange,
}: StepProductContextProps) {
  const [companyExpanded, setCompanyExpanded] = useState(false);
  const [expandedMemoryId, setExpandedMemoryId] = useState<string | null>(null);

  function toggleMemory(id: string) {
    if (selectedProductMemoryIds.includes(id)) {
      onSelectedProductMemoryIdsChange(selectedProductMemoryIds.filter((mid) => mid !== id));
    } else {
      onSelectedProductMemoryIdsChange([...selectedProductMemoryIds, id]);
    }
  }

  return (
    <WizardStep
      title="Product Context"
      description="Provide context about the company, product, and feature being researched."
    >
      <div className="space-y-8">
        {/* ── Company Info (built-in memory, always included) ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Company Info</h3>
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
                  onClick={() => setCompanyExpanded(!companyExpanded)}
                >
                  {companyExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  {companyExpanded ? "Collapse" : "Preview"}
                </Button>
              </div>
            </CardHeader>
            {companyExpanded && (
              <CardContent className="pt-0">
                <ScrollArea className="h-48 rounded-lg border">
                  <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-muted-foreground">
                    {builtInCompanyContent}
                  </pre>
                </ScrollArea>
              </CardContent>
            )}
          </Card>
          <div className="space-y-2">
            <Label>Additional Company Context</Label>
            <Textarea
              placeholder="Add any extra company context not covered above..."
              value={productContext.companyAdditionalContext}
              onChange={(e) => onChange({ ...productContext, companyAdditionalContext: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* ── Product Info (selectable memory or custom) ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Product Info</h3>
          {productMemories.length > 0 && (
            <div className="space-y-2">
              <Label>Product Context Memories</Label>
              <div className="grid gap-2">
                {productMemories.map((memory) => {
                  const isSelected = selectedProductMemoryIds.includes(memory.id);
                  const isExpanded = expandedMemoryId === memory.id;
                  return (
                    <Card
                      key={memory.id}
                      size="sm"
                      className={cn(
                        "transition-all duration-150 cursor-pointer",
                        isSelected && "ring-2 ring-primary"
                      )}
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
                            onClick={() => setExpandedMemoryId(isExpanded ? null : memory.id)}
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
            </div>
          )}
          <UrlOrFileField
            data={productContext.productInfo}
            onChange={(productInfo: FormFieldData) => onChange({ ...productContext, productInfo })}
            label="Custom Product Info"
            urlPlaceholder="https://product-docs.com"
            showTextOption
          />
          <p className="text-xs text-muted-foreground">
            If this URL requires authentication, use file upload or paste the content as text instead.
          </p>
        </div>

        {/* ── Feature Info (URL/file/text) ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Feature Info</h3>
          <UrlOrFileField
            data={productContext.featureInfo}
            onChange={(featureInfo: FormFieldData) => onChange({ ...productContext, featureInfo })}
            label="Feature Description"
            urlPlaceholder="https://spec.example.com/feature"
            showTextOption
          />
          <p className="text-xs text-muted-foreground">
            Describe the feature being researched — its purpose, current state, and what you want to learn.
          </p>
        </div>

        {/* ── Additional Context (URL/file/text) ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Additional Context <span className="font-normal text-muted-foreground">(optional)</span></h3>
          <UrlOrFileField
            data={productContext.additionalContext}
            onChange={(additionalContext: FormFieldData) => onChange({ ...productContext, additionalContext })}
            label="Extra Context"
            urlPlaceholder="https://docs.example.com/context"
            showTextOption
          />
        </div>
      </div>
    </WizardStep>
  );
}
