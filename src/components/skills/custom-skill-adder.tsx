'use client';

import { useRef, useState } from 'react';
import type { CustomSkill } from '@/lib/types';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/id';
import { fileToAttachment } from '@/lib/file-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Link, FileText } from 'lucide-react';

interface CustomSkillAdderProps {
  skills: CustomSkill[];
  onChange: (skills: CustomSkill[]) => void;
}

export function CustomSkillAdder({ skills, onChange }: CustomSkillAdderProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'url' | 'file'>('url');
  const [urlValue, setUrlValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName('');
    setType('url');
    setUrlValue('');
    setSelectedFile(null);
    setShowForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleRemove(skillId: string) {
    onChange(skills.filter((s) => s.id !== skillId));
  }

  async function handleAdd() {
    if (!name.trim()) return;
    if (type === 'url' && !urlValue.trim()) return;
    if (type === 'file' && !selectedFile) return;

    setIsAdding(true);
    try {
      const newSkill: CustomSkill = {
        id: generateId(),
        name: name.trim(),
        type,
        urlValue: type === 'url' ? urlValue.trim() : '',
        fileContent: null,
      };

      if (type === 'file' && selectedFile) {
        newSkill.fileContent = await fileToAttachment(selectedFile);
      }

      onChange([...skills, newSkill]);
      resetForm();
    } catch (error) {
      console.error('Failed to add custom skill:', error);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="space-y-3">
      {skills.length > 0 && (
        <div className="grid gap-2">
          {skills.map((skill) => (
            <Card key={skill.id} size="sm">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {skill.type === 'url' ? (
                    <Link className="size-3.5 text-muted-foreground" />
                  ) : (
                    <FileText className="size-3.5 text-muted-foreground" />
                  )}
                  <span className="font-medium">{skill.name}</span>
                  {skill.type === 'url' && skill.urlValue && (
                    <span className="max-w-48 truncate text-xs text-muted-foreground">
                      {skill.urlValue}
                    </span>
                  )}
                  {skill.type === 'file' && skill.fileContent && (
                    <span className="text-xs text-muted-foreground">
                      {skill.fileContent.name}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleRemove(skill.id)}
                >
                  <Trash2 className="text-destructive" />
                  <span className="sr-only">Remove</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm ? (
        <Card size="sm">
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Skill name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={type === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType('url')}
                >
                  <Link />
                  URL
                </Button>
                <Button
                  variant={type === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setType('file')}
                >
                  <FileText />
                  File
                </Button>
              </div>
            </div>

            {type === 'url' ? (
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="custom-skill-file">File</Label>
                <Input
                  id="custom-skill-file"
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedFile(file);
                  }}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={
                  isAdding ||
                  !name.trim() ||
                  (type === 'url' && !urlValue.trim()) ||
                  (type === 'file' && !selectedFile)
                }
              >
                {isAdding ? 'Adding...' : 'Add'}
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus />
          Add Custom Skill
        </Button>
      )}
    </div>
  );
}
