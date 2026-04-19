"use client";

import { SharedSkillsPicker } from "@/components/skills/shared-skills-picker";
import { CustomSkillAdder } from "@/components/skills/custom-skill-adder";
import { SharedMemoriesPicker } from "@/components/memories/shared-memories-picker";
import type { BuiltInSkill } from "@/lib/built-in-skills";
import type { SharedSkill, CustomSkill, SharedMemory, CustomMemory } from "@/lib/types";
import { useRef, useState } from "react";
import { useSharedMemories } from "@/hooks/use-shared-memories";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface StepSkillsMemoriesProps {
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
  lockedSkillIds?: string[];
  builtInSkills?: BuiltInSkill[];
}

export function StepSkillsMemories({
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
  lockedSkillIds = [],
  builtInSkills = [],
}: StepSkillsMemoriesProps) {
  const { addMemory } = useSharedMemories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [saveToShared, setSaveToShared] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setUploadContent(text);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.md$/, ""));
      }
    };
    reader.readAsText(file);
  }

  async function handleAddMemory() {
    if (!uploadName.trim() || !uploadContent.trim()) return;

    if (saveToShared) {
      const id = await addMemory({
        name: uploadName.trim(),
        description: "",
        content: uploadContent,
        fileName: `${uploadName.trim().toLowerCase().replace(/\s+/g, "-")}.md`,
        isBuiltIn: false,
        category: null,
        tags: [],
      });
      onSharedMemoriesChange([...selectedSharedMemoryIds, id]);
      toast.success("Memory saved to shared library");
    } else {
      const customMemory: CustomMemory = {
        id: generateId(),
        name: uploadName.trim(),
        content: uploadContent,
      };
      onCustomMemoriesChange([...customMemories, customMemory]);
      toast.success("Custom memory added");
    }

    setUploadName("");
    setUploadContent("");
    setSaveToShared(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveCustomMemory(id: string) {
    onCustomMemoriesChange(customMemories.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Skills & Memories
        </h2>
        <p className="text-sm text-muted-foreground">
          Select skills and memories to provide additional context to the
          research agent.
        </p>
      </div>

      <div className="space-y-8">
        {/* Skills section */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Shared Skills</h3>
          <SharedSkillsPicker
            sharedSkills={sharedSkills}
            builtInSkills={builtInSkills}
            selectedIds={selectedSharedSkillIds}
            onChange={onSharedSkillsChange}
            lockedIds={lockedSkillIds}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Custom Skills</h3>
          <CustomSkillAdder
            skills={customSkills}
            onChange={onCustomSkillsChange}
          />
        </section>

        {/* Memories section */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Shared Memories</h3>
          <SharedMemoriesPicker
            sharedMemories={sharedMemories.filter(
              (m) =>
                !m.isBuiltIn ||
                lockedMemoryIds.includes(m.id) ||
                selectedSharedMemoryIds.includes(m.id)
            )}
            selectedIds={selectedSharedMemoryIds}
            onChange={onSharedMemoriesChange}
            lockedIds={lockedMemoryIds}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Upload Memory</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="researcher-memory-file">Upload .md file</Label>
              <Input
                id="researcher-memory-file"
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
              <Label className="text-sm font-normal">
                Save to Shared Memories library
              </Label>
            </div>

            <Button
              size="sm"
              onClick={handleAddMemory}
              disabled={!uploadName.trim() || !uploadContent.trim()}
            >
              <Upload className="size-4" />
              Add Memory
            </Button>
          </div>
        </section>

        {customMemories.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium">
              Custom Memories (this project only)
            </h3>
            <div className="grid gap-2">
              {customMemories.map((memory) => (
                <Card key={memory.id} size="sm">
                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm font-medium">{memory.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomMemory(memory.id)}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
