"use client";

import { useState } from "react";
import { UrlOrFileField } from "@/components/fields/url-or-file-field";
import { WizardStep } from "./wizard-step";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lock, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormFieldData, SharedMemory } from "@/lib/types";

interface StepCompanyProductProps {
  companyData: FormFieldData;
  onCompanyChange: (data: FormFieldData) => void;
  productData: FormFieldData;
  onProductChange: (data: FormFieldData) => void;
  builtInCompanyContent: string;
  productMemories: SharedMemory[];
  selectedMemoryIds: string[];
  onSelectedMemoryIdsChange: (ids: string[]) => void;
}

/**
 * Merged "Company & Product" step. Boomi Context is locked/always included;
 * Rivery Context is an opt-in memory. Freeform text lets users add extra
 * context beyond what the built-in memories cover.
 */
export function StepCompanyProduct({
  companyData,
  onCompanyChange,
  productData,
  onProductChange,
  builtInCompanyContent,
  productMemories,
  selectedMemoryIds,
  onSelectedMemoryIdsChange,
}: StepCompanyProductProps) {
  const [companyExpanded, setCompanyExpanded] = useState(false);
  const [productExpandedId, setProductExpandedId] = useState<string | null>(null);

  function toggleMemory(id: string) {
    if (selectedMemoryIds.includes(id)) {
      onSelectedMemoryIdsChange(selectedMemoryIds.filter((mid) => mid !== id));
    } else {
      onSelectedMemoryIdsChange([...selectedMemoryIds, id]);
    }
  }

  return (
    <WizardStep
      title="Company & Product"
      description="Boomi context is always included. Add product context to anchor the generated brief."
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Company</h3>
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
                  className="cursor-pointer"
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
            <Label>Additional company context</Label>
            <Textarea
              placeholder="Anything not covered by the Boomi Context memory..."
              value={companyData.additionalContext}
              onChange={(e) => onCompanyChange({ ...companyData, additionalContext: e.target.value })}
              rows={3}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Product</h3>
          {productMemories.length > 0 && (
            <div className="space-y-2">
              <Label>Product context memories</Label>
              <div className="grid gap-2">
                {productMemories.map((memory) => {
                  const isSelected = selectedMemoryIds.includes(memory.id);
                  const isExpanded = productExpandedId === memory.id;
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
                            onClick={() => setProductExpandedId(isExpanded ? null : memory.id)}
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
            </div>
          )}

          <UrlOrFileField
            data={productData}
            onChange={onProductChange}
            label="Additional product info (optional)"
            urlPlaceholder="https://product-docs.example.com"
            showTextOption
          />
        </section>
      </div>
    </WizardStep>
  );
}
