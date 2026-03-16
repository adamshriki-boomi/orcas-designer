'use client';

import { useState } from 'react';
import type { SharedSkill, FileAttachment } from '@/lib/types';
import type { MandatorySkill } from '@/lib/constants';
import { MANDATORY_SKILLS, SKILL_CATEGORIES } from '@/lib/constants';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useManagerState } from '@/hooks/use-manager-state';
import { fileToAttachment } from '@/lib/file-utils';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { SkillCard } from './skill-card';
import { Plus, Link, FileText, Wand2, ExternalLink } from 'lucide-react';

interface SkillFormState {
  name: string;
  description: string;
  type: 'url' | 'file';
  urlValue: string;
  file: File | null;
  existingFile: FileAttachment | null;
}

const emptyFormState: SkillFormState = {
  name: '',
  description: '',
  type: 'url',
  urlValue: '',
  file: null,
  existingFile: null,
};

export function SharedSkillManager() {
  const { sharedSkills, addSkill, updateSkill, deleteSkill, isSkillUsed } =
    useSharedSkills();

  const mgr = useManagerState<SkillFormState>(emptyFormState);
  const [viewingSkill, setViewingSkill] = useState<MandatorySkill | SharedSkill | null>(null);

  function openEditDialog(skill: SharedSkill) {
    mgr.openEdit(skill.id, {
      name: skill.name,
      description: skill.description,
      type: skill.type,
      urlValue: skill.urlValue,
      file: null,
      existingFile: skill.fileContent,
    });
  }

  async function openDeleteDialog(skillId: string) {
    const projects = await isSkillUsed(skillId);
    mgr.openDelete(skillId, projects);
  }

  function openViewDialog(skill: MandatorySkill | SharedSkill) {
    setViewingSkill(skill);
    mgr.openView();
  }

  async function handleSave() {
    const { form, editingId } = mgr;
    if (!form.name.trim() || !form.description.trim()) return;
    if (form.type === 'url' && !form.urlValue.trim()) return;
    if (form.type === 'file' && !form.file && !form.existingFile) return;

    mgr.setIsSaving(true);
    try {
      let fileContent: FileAttachment | null = form.existingFile;

      if (form.type === 'file' && form.file) {
        fileContent = await fileToAttachment(form.file);
      } else if (form.type === 'url') {
        fileContent = null;
      }

      if (editingId) {
        await updateSkill(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          type: form.type,
          urlValue: form.type === 'url' ? form.urlValue.trim() : '',
          fileContent,
        });
        toast.success('Skill updated successfully.');
      } else {
        await addSkill({
          name: form.name.trim(),
          description: form.description.trim(),
          type: form.type,
          urlValue: form.type === 'url' ? form.urlValue.trim() : '',
          fileContent,
        });
        toast.success('Skill created successfully.');
      }

      mgr.closeDialog();
    } catch (error) {
      console.error('Failed to save skill:', error);
      toast.error('Failed to save skill.');
    } finally {
      mgr.setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!mgr.deletingId) return;
    mgr.setIsDeleting(true);
    try {
      await deleteSkill(mgr.deletingId);
      toast.success('Skill deleted successfully.');
      mgr.closeDelete();
    } catch (error) {
      console.error('Failed to delete skill:', error);
      toast.error('Failed to delete skill.');
    } finally {
      mgr.setIsDeleting(false);
    }
  }

  const isFormValid =
    mgr.form.name.trim() !== '' &&
    mgr.form.description.trim() !== '' &&
    (mgr.form.type === 'url' ? mgr.form.urlValue.trim() !== '' : mgr.form.file !== null || mgr.form.existingFile !== null);

  function isMandatory(skill: MandatorySkill | SharedSkill): skill is MandatorySkill {
    return 'invocation' in skill;
  }

  return (
    <div className="space-y-10">
      {/* Built-in Skills */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Wand2 className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold">Built-in Skills</h2>
            <p className="text-xs text-muted-foreground">{MANDATORY_SKILLS.length} skills included by default</p>
          </div>
        </div>
        <div className="space-y-6">
          {SKILL_CATEGORIES.map((category) => {
            const skills = MANDATORY_SKILLS.filter((s) => s.category === category);
            return (
              <section key={category}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {category}
                </h3>
                <StaggerContainer className="grid gap-2 sm:grid-cols-2">
                  {skills.map((skill) => (
                    <StaggerItem key={skill.name}>
                      <SkillCard
                        skill={skill}
                        locked
                        onView={() => openViewDialog(skill)}
                      />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </section>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px gradient-border" />

      {/* Custom Shared Skills */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
              <Plus className="size-4 text-accent" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold">Custom Shared Skills</h2>
              <p className="text-xs text-muted-foreground">
                {sharedSkills.length === 0 ? 'Create skills to reuse across projects' : `${sharedSkills.length} custom skill${sharedSkills.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={mgr.openAdd}>
            <Plus />
            Add Skill
          </Button>
        </div>

        {sharedSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/20 py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Wand2 className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">No custom skills yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-xs">
              Add skills as URLs or files to share them across all your projects.
            </p>
          </div>
        ) : (
          <StaggerContainer className="grid gap-2 sm:grid-cols-2">
            {sharedSkills.map((skill) => (
              <StaggerItem key={skill.id}>
                <SkillCard
                  skill={skill}
                  onView={() => openViewDialog(skill)}
                  onEdit={() => openEditDialog(skill)}
                  onDelete={() => openDeleteDialog(skill.id)}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Add / Edit Drawer */}
      <Drawer open={mgr.dialogOpen} onOpenChange={(open) => { if (!open) mgr.closeDialog(); }} direction="right">
        <DrawerContent width="25">
          <DrawerHeader>
            <DrawerTitle>
              {mgr.editingId ? 'Edit Shared Skill' : 'Add Shared Skill'}
            </DrawerTitle>
            <DrawerDescription>
              {mgr.editingId
                ? 'Update the shared skill details.'
                : 'Create a new skill that can be shared across projects.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="skill-name">Name</Label>
              <Input
                id="skill-name"
                placeholder="Skill name"
                value={mgr.form.name}
                onChange={(e) => mgr.setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skill-description">Description</Label>
              <Input
                id="skill-description"
                placeholder="Brief description of what this skill does"
                value={mgr.form.description}
                onChange={(e) =>
                  mgr.setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={mgr.form.type === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    mgr.setForm((f) => ({ ...f, type: 'url' }))
                  }
                >
                  <Link />
                  URL
                </Button>
                <Button
                  variant={mgr.form.type === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    mgr.setForm((f) => ({ ...f, type: 'file' }))
                  }
                >
                  <FileText />
                  File
                </Button>
              </div>
            </div>

            {mgr.form.type === 'url' ? (
              <div className="space-y-1.5">
                <Label htmlFor="skill-url">URL</Label>
                <Input
                  id="skill-url"
                  type="url"
                  placeholder="https://..."
                  value={mgr.form.urlValue}
                  onChange={(e) =>
                    mgr.setForm((f) => ({ ...f, urlValue: e.target.value }))
                  }
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="skill-file">File</Label>
                {mgr.form.existingFile && !mgr.form.file && (
                  <p className="text-xs text-muted-foreground">
                    Current file: {mgr.form.existingFile.name}
                  </p>
                )}
                <Input
                  id="skill-file"
                  ref={mgr.fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    mgr.setForm((f) => ({ ...f, file }));
                  }}
                />
              </div>
            )}
          </div>

          <DrawerFooter className="flex-row justify-end gap-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button onClick={handleSave} disabled={!isFormValid || mgr.isSaving}>
              {mgr.isSaving ? 'Saving...' : mgr.editingId ? 'Update' : 'Create'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation */}
      <AlertDialog open={mgr.deleteDialogOpen} onOpenChange={mgr.setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shared Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this skill? This action cannot be undone.
              {mgr.usedInProjects.length > 0 && (
                <>
                  {' '}This skill is currently used in {mgr.usedInProjects.length}{' '}
                  {mgr.usedInProjects.length === 1 ? 'project' : 'projects'}:{' '}
                  {mgr.usedInProjects.join(', ')}. It will be removed from all of them.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={mgr.isDeleting}
            >
              {mgr.isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Drawer */}
      <Drawer open={mgr.viewDialogOpen} onOpenChange={mgr.setViewDialogOpen} direction="right">
        <DrawerContent width="25">
          <DrawerHeader>
            <DrawerTitle>{viewingSkill?.name}</DrawerTitle>
            <DrawerDescription>
              {viewingSkill && isMandatory(viewingSkill) ? 'Built-in skill details' : 'Shared skill details'}
            </DrawerDescription>
          </DrawerHeader>
          {viewingSkill && (
            <div className="flex-1 overflow-y-auto px-4 space-y-3">
              {isMandatory(viewingSkill) ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{viewingSkill.category}</Badge>
                    <Badge variant="outline">Built-in</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{viewingSkill.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invocation</p>
                    <code className="text-sm rounded bg-muted px-1.5 py-0.5">{viewingSkill.invocation}</code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">GitHub Repository</p>
                    <a
                      href={viewingSkill.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
                    >
                      <ExternalLink className="size-3.5" />
                      {viewingSkill.repoUrl.replace('https://github.com/', '')}
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{viewingSkill.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      {viewingSkill.type === 'url' ? (
                        <><Link className="size-3.5" /> URL</>
                      ) : (
                        <><FileText className="size-3.5" /> File</>
                      )}
                    </div>
                  </div>
                  {viewingSkill.type === 'url' && viewingSkill.urlValue && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">URL</p>
                      <a
                        href={viewingSkill.urlValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all cursor-pointer"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        {viewingSkill.urlValue}
                      </a>
                    </div>
                  )}
                  {viewingSkill.type === 'file' && viewingSkill.fileContent && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">File</p>
                      <p className="text-sm">{viewingSkill.fileContent.name}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
