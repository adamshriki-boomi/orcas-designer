'use client';

import { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UrlOrFileField } from '@/components/fields/url-or-file-field';
import { UrlInput } from '@/components/fields/url-input';
import { AdditionalContext } from '@/components/fields/additional-context';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Brain, Lock } from 'lucide-react';
import type { FormFieldData, FieldType, SharedMemory } from '@/lib/types';

export interface ContextMemory {
  memory: SharedMemory;
  locked: boolean;
}

const URL_PLACEHOLDERS: Record<string, string> = {
  featureInfo: 'https://mycompany.atlassian.net/wiki/spaces/...',
  figmaFileLink: 'https://www.figma.com/...',
  designSystemStorybook: 'https://storybook.example.com',
  designSystemNpm: 'https://www.npmjs.com/package/...',
  designSystemFigma: 'https://figma.com/design/...',
  prototypeSketches: 'https://prototype.example.com',
};

interface EditFieldDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldKey: string;
  label: string;
  data: FormFieldData;
  onSave: (data: FormFieldData) => void;
  contextMemories?: ContextMemory[];
  selectedMemoryIds?: string[];
  onSelectedMemoryIdsChange?: (ids: string[]) => void;
}

export function EditFieldDrawer({
  open,
  onOpenChange,
  fieldKey,
  label,
  data,
  onSave,
  contextMemories = [],
  selectedMemoryIds = [],
  onSelectedMemoryIdsChange,
}: EditFieldDrawerProps) {
  const [draft, setDraft] = useState<FormFieldData>(data);
  const [draftMemoryIds, setDraftMemoryIds] = useState<string[]>(selectedMemoryIds);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(data);
      setDraftMemoryIds(selectedMemoryIds);
      setExpandedId(null);
    }
  }, [open, data, selectedMemoryIds]);

  const handleSave = () => {
    onSave(draft);
    if (onSelectedMemoryIdsChange) {
      onSelectedMemoryIdsChange(draftMemoryIds);
    }
    onOpenChange(false);
  };

  function toggleMemory(id: string) {
    setDraftMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  }

  const update = (partial: Partial<FormFieldData>) => {
    setDraft((d) => ({ ...d, ...partial }));
  };

  const hasContextMemories = contextMemories.length > 0;

  function renderContextMemories() {
    if (!hasContextMemories) return null;
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Context Memories</p>
        <div className="grid gap-2">
          {contextMemories.map(({ memory, locked }) => {
            const isSelected = locked || draftMemoryIds.includes(memory.id);
            const isExpanded = expandedId === memory.id;

            return (
              <Card
                key={memory.id}
                size="sm"
                className={cn(
                  'transition-all duration-150',
                  isSelected && 'ring-2 ring-primary'
                )}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {locked ? (
                      <Lock className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleMemory(memory.id)}
                      />
                    )}
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="size-3.5 text-muted-foreground" />
                      {memory.name}
                      <Badge variant="secondary">{locked ? 'Always included' : 'Built-in'}</Badge>
                    </CardTitle>
                  </div>
                  <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : memory.id)}
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      {isExpanded ? 'Collapse' : 'Preview'}
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
    );
  }

  function renderFieldContent() {
    // companyInfo: context memories + textarea only (matches wizard)
    if (fieldKey === 'companyInfo') {
      return (
        <div className="space-y-4">
          <Label htmlFor="additional-context">Additional Context</Label>
          <Textarea
            id="additional-context"
            placeholder="Add any extra company context not covered above..."
            value={draft.additionalContext}
            onChange={(e) => update({ additionalContext: e.target.value })}
            rows={4}
          />
        </div>
      );
    }

    // figmaFileLink: URL only + AdditionalContext (matches wizard)
    if (fieldKey === 'figmaFileLink') {
      return (
        <div className="space-y-3">
          <Label>Figma File URL</Label>
          <UrlInput
            value={draft.urlValue}
            onChange={(urlValue) => update({ urlValue })}
            placeholder={URL_PLACEHOLDERS.figmaFileLink}
          />
          <AdditionalContext
            value={draft.additionalContext}
            onChange={(additionalContext) => update({ additionalContext })}
          />
        </div>
      );
    }

    // designSystemNpm: Command / URL tabs (matches wizard)
    if (fieldKey === 'designSystemNpm') {
      const activeTab = draft.inputType === 'url' ? 'url' : 'text';
      const setTab = (tab: string) => update({ inputType: tab as FieldType });

      return (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="text">Command</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <div className="space-y-1.5">
                <Label>Install Command</Label>
                <Input
                  value={draft.textValue}
                  onChange={(e) => update({ textValue: e.target.value })}
                  placeholder="npm install @company/design-system"
                />
              </div>
            </TabsContent>

            <TabsContent value="url">
              <div className="space-y-1.5">
                <Label>Package URL</Label>
                <UrlInput
                  value={draft.urlValue}
                  onChange={(urlValue) => update({ urlValue })}
                  placeholder={URL_PLACEHOLDERS.designSystemNpm}
                />
              </div>
            </TabsContent>
          </Tabs>

          <AdditionalContext
            value={draft.additionalContext}
            onChange={(additionalContext) => update({ additionalContext })}
          />
        </div>
      );
    }

    // prototypeSketches: URL/File/Text with multiFile (matches wizard)
    if (fieldKey === 'prototypeSketches') {
      return (
        <UrlOrFileField
          data={draft}
          onChange={setDraft}
          label={hasContextMemories ? `Additional ${label}` : label}
          urlPlaceholder={URL_PLACEHOLDERS[fieldKey]}
          showTextOption
          multiFile
          acceptFiles="image/*"
        />
      );
    }

    // Default: URL/File/Text for featureInfo, productInfo, etc.
    const showTextOption = ['productInfo', 'featureInfo'].includes(fieldKey);
    return (
      <UrlOrFileField
        data={draft}
        onChange={setDraft}
        label={hasContextMemories ? `Additional ${label}` : label}
        urlPlaceholder={URL_PLACEHOLDERS[fieldKey]}
        showTextOption={showTextOption}
      />
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent width="25">
        <DrawerHeader>
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerDescription>
            Update the {label.toLowerCase()} for this project.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {renderContextMemories()}
          {renderFieldContent()}
        </div>

        <DrawerFooter className="flex-row justify-end gap-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button onClick={handleSave}>Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
