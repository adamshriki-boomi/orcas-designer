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
import { UrlOrFileField } from '@/components/fields/url-or-file-field';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Brain, Lock } from 'lucide-react';
import type { FormFieldData, SharedMemory } from '@/lib/types';

export interface ContextMemory {
  memory: SharedMemory;
  locked: boolean;
}

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

  const showTextOption = ['companyInfo', 'productInfo', 'featureInfo'].includes(fieldKey);
  const hasContextMemories = contextMemories.length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent width="50">
        <DrawerHeader>
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerDescription>
            Update the {label.toLowerCase()} for this project.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {hasContextMemories && (
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
          )}

          <UrlOrFileField
            data={draft}
            onChange={setDraft}
            label={hasContextMemories ? `Additional ${label}` : label}
            showTextOption={showTextOption}
          />
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
