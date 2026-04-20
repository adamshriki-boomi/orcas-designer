'use client';

import { useMemo, useRef, useState } from 'react';
import { MandatorySkillsList } from '@/components/skills/mandatory-skills-list';
import { SharedSkillsPicker } from '@/components/skills/shared-skills-picker';
import { CustomSkillAdder } from '@/components/skills/custom-skill-adder';
import { SharedMemoriesPicker } from '@/components/memories/shared-memories-picker';
import { WizardStep } from './wizard-step';
import { getActiveSkillsForPrompt } from '@/lib/skill-filter';
import { useSharedMemories } from '@/hooks/use-shared-memories';
import { generateId } from '@/lib/id';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import type {
  Prompt,
  SharedSkill,
  SharedMemory,
  CustomSkill,
  CustomMemory,
} from '@/lib/types';

interface StepSkillsMemoriesProps {
  formData: Prompt;
  sharedSkills: SharedSkill[];
  selectedSharedSkillIds: string[];
  onSharedSkillsChange: (ids: string[]) => void;
  customSkills: CustomSkill[];
  onCustomSkillsChange: (skills: CustomSkill[]) => void;
  sharedMemories: SharedMemory[];
  selectedSharedMemoryIds: string[];
  onSharedMemoriesChange: (ids: string[]) => void;
  customMemories: CustomMemory[];
  onCustomMemoriesChange: (memories: CustomMemory[]) => void;
  lockedMemoryIds?: string[];
}

/**
 * Merged "Skills & Memories" step. Everything that tells Claude Code *how*
 * to work (skills) and *what* to know (memories) lives here. The mandatory
 * skills row shows the auto-filtered set so users understand what's
 * included by default.
 */
export function StepSkillsMemories({
  formData,
  sharedSkills,
  selectedSharedSkillIds,
  onSharedSkillsChange,
  customSkills,
  onCustomSkillsChange,
  sharedMemories,
  selectedSharedMemoryIds,
  onSharedMemoriesChange,
  customMemories,
  onCustomMemoriesChange,
  lockedMemoryIds = [],
}: StepSkillsMemoriesProps) {
  const activeSkills = useMemo(() => getActiveSkillsForPrompt(formData), [formData]);
  const { addMemory } = useSharedMemories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [saveToShared, setSaveToShared] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadContent(text);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.md$/, ''));
      }
    };
    reader.readAsText(file);
  }

  async function handleAddMemory() {
    if (!uploadName.trim() || !uploadContent.trim()) return;
    if (saveToShared) {
      const id = await addMemory({
        name: uploadName.trim(),
        description: '',
        content: uploadContent,
        fileName: `${uploadName.trim().toLowerCase().replace(/\s+/g, '-')}.md`,
        isBuiltIn: false,
        category: null,
        tags: [],
      });
      onSharedMemoriesChange([...selectedSharedMemoryIds, id]);
      toast.success('Memory saved to shared library');
    } else {
      const customMemory: CustomMemory = {
        id: generateId(),
        name: uploadName.trim(),
        content: uploadContent,
      };
      onCustomMemoriesChange([...customMemories, customMemory]);
      toast.success('Custom memory added');
    }
    setUploadName('');
    setUploadContent('');
    setSaveToShared(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRemoveCustomMemory(id: string) {
    onCustomMemoriesChange(customMemories.filter((m) => m.id !== id));
  }

  return (
    <WizardStep
      title="Skills & Memories"
      description="Skills tell Claude Code how to work; memories give it knowledge. Mandatory skills auto-filter based on your project."
    >
      <div className="space-y-10">
        <section className="space-y-6">
          <h2 className="text-base font-semibold">Skills</h2>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Mandatory ({activeSkills.length})</h3>
            <MandatorySkillsList skills={activeSkills} />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Shared skills</h3>
            <SharedSkillsPicker
              sharedSkills={sharedSkills}
              selectedIds={selectedSharedSkillIds}
              onChange={onSharedSkillsChange}
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Custom skills</h3>
            <CustomSkillAdder skills={customSkills} onChange={onCustomSkillsChange} />
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-base font-semibold">Memories</h2>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Shared memories</h3>
            <SharedMemoriesPicker
              sharedMemories={sharedMemories.filter(
                (m) =>
                  !m.isBuiltIn ||
                  lockedMemoryIds.includes(m.id) ||
                  selectedSharedMemoryIds.includes(m.id),
              )}
              selectedIds={selectedSharedMemoryIds}
              onChange={onSharedMemoriesChange}
              lockedIds={lockedMemoryIds}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Upload memory</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="inline-memory-file">Upload .md file</Label>
                <Input
                  id="inline-memory-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={handleFileUpload}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  placeholder="Memory name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea
                  placeholder="Paste markdown content or upload a file..."
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={saveToShared}
                  onCheckedChange={(checked) => setSaveToShared(checked === true)}
                />
                <Label className="text-sm font-normal">Save to shared library</Label>
              </div>
              <Button
                size="sm"
                onClick={handleAddMemory}
                disabled={!uploadName.trim() || !uploadContent.trim()}
                className="cursor-pointer"
              >
                <Upload className="size-4" />
                Add memory
              </Button>
            </div>
          </div>

          {customMemories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Custom memories (this prompt only)</h3>
              <div className="grid gap-2">
                {customMemories.map((memory) => (
                  <Card key={memory.id} size="sm">
                    <CardContent className="flex items-center justify-between">
                      <span className="text-sm font-medium">{memory.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomMemory(memory.id)}
                        className="cursor-pointer"
                      >
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </WizardStep>
  );
}
