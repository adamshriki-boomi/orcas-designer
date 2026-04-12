'use client';

import { useState } from 'react';
import type { SharedMemory } from '@/lib/types';
import { useSharedMemories } from '@/hooks/use-shared-memories';
import { useManagerState } from '@/hooks/use-manager-state';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';
import { SectionLoader } from '@/components/ui/loader';
import { MemoryCard } from './memory-card';
import { Plus, Brain } from 'lucide-react';

interface MemoryFormState {
  name: string;
  description: string;
  content: string;
  fileName: string;
}

const emptyFormState: MemoryFormState = {
  name: '',
  description: '',
  content: '',
  fileName: '',
};

export function SharedMemoryManager() {
  const { sharedMemories, isLoading, addMemory, updateMemory, deleteMemory, isMemoryUsed } =
    useSharedMemories();

  const mgr = useManagerState<MemoryFormState>(emptyFormState);
  const [viewingMemory, setViewingMemory] = useState<SharedMemory | null>(null);

  function openEditDialog(memory: SharedMemory) {
    mgr.openEdit(memory.id, {
      name: memory.name,
      description: memory.description,
      content: memory.content,
      fileName: memory.fileName,
    });
  }

  async function openDeleteDialog(memoryId: string) {
    const projects = await isMemoryUsed(memoryId);
    mgr.openDelete(memoryId, projects);
  }

  function openViewDialog(memory: SharedMemory) {
    setViewingMemory(memory);
    mgr.openView();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      mgr.setForm((f) => ({
        ...f,
        content: text,
        fileName: file.name,
        name: f.name || file.name.replace(/\.md$/, ''),
      }));
    };
    reader.readAsText(file);
  }

  async function handleSave() {
    const { form, editingId } = mgr;
    if (!form.name.trim() || !form.content.trim()) return;

    mgr.setIsSaving(true);
    try {
      if (editingId) {
        await updateMemory(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          content: form.content,
          fileName: form.fileName || `${form.name.trim().toLowerCase().replace(/\s+/g, '-')}.md`,
        });
        toast.success('Memory updated');
      } else {
        await addMemory({
          name: form.name.trim(),
          description: form.description.trim(),
          content: form.content,
          fileName: form.fileName || `${form.name.trim().toLowerCase().replace(/\s+/g, '-')}.md`,
          isBuiltIn: false,
        });
        toast.success('Memory created');
      }

      mgr.closeDialog();
    } catch (error) {
      console.error('Failed to save memory:', error);
      toast.error('Unable to save memory');
    } finally {
      mgr.setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!mgr.deletingId) return;
    mgr.setIsDeleting(true);
    try {
      await deleteMemory(mgr.deletingId);
      toast.success('Memory deleted');
      mgr.closeDelete();
    } catch (error) {
      console.error('Failed to delete memory:', error);
      toast.error('Unable to delete memory');
    } finally {
      mgr.setIsDeleting(false);
    }
  }

  const isFormValid = mgr.form.name.trim() !== '' && mgr.form.content.trim() !== '';

  const builtInMemories = sharedMemories.filter((m) => m.isBuiltIn);
  const customMemories = sharedMemories.filter((m) => !m.isBuiltIn);

  if (isLoading) {
    return <SectionLoader label="Loading memories..." />;
  }

  return (
    <div className="space-y-10">
      {/* Built-in Memories */}
      {builtInMemories.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold">Built-in Memories</h2>
              <p className="text-xs text-muted-foreground">{builtInMemories.length} context file{builtInMemories.length !== 1 ? 's' : ''} included by default</p>
            </div>
          </div>
          <StaggerContainer className="grid gap-2 sm:grid-cols-2">
            {builtInMemories.map((memory) => (
              <StaggerItem key={memory.id}>
                <MemoryCard
                  memory={memory}
                  onView={() => openViewDialog(memory)}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Divider */}
      {builtInMemories.length > 0 && <div className="h-px gradient-border" />}

      {/* Custom Shared Memories */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
              <Plus className="size-4 text-accent" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold">Custom Shared Memories</h2>
              <p className="text-xs text-muted-foreground">
                {customMemories.length === 0 ? 'Add context files to share across projects' : `${customMemories.length} custom memor${customMemories.length !== 1 ? 'ies' : 'y'}`}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={mgr.openAdd}>
            <Plus />
            Add Memory
          </Button>
        </div>

        {customMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/20 py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Brain className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">No custom memories yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-xs">
              Upload markdown files or paste content to create shared context across all your projects.
            </p>
          </div>
        ) : (
          <StaggerContainer className="grid gap-2 sm:grid-cols-2">
            {customMemories.map((memory) => (
              <StaggerItem key={memory.id}>
                <MemoryCard
                  memory={memory}
                  onView={() => openViewDialog(memory)}
                  onEdit={() => openEditDialog(memory)}
                  onDelete={() => openDeleteDialog(memory.id)}
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
              {mgr.editingId ? 'Edit Shared Memory' : 'Add Shared Memory'}
            </DrawerTitle>
            <DrawerDescription>
              {mgr.editingId
                ? 'Update the shared memory details.'
                : 'Upload a .md file or paste markdown content to create a shared memory.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Memory name"
                value={mgr.form.name}
                onChange={(e) => mgr.setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of this memory"
                value={mgr.form.description}
                onChange={(e) =>
                  mgr.setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memory-file">Upload .md file</Label>
              <Input
                id="memory-file"
                ref={mgr.fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea
                placeholder="Paste markdown content here, or upload a file above..."
                value={mgr.form.content}
                onChange={(e) => mgr.setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                className="font-mono text-xs"
              />
            </div>
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
            <AlertDialogTitle>Delete Shared Memory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this memory? This action cannot be undone.
              {mgr.usedInProjects.length > 0 && (
                <>
                  {' '}This memory is currently used in {mgr.usedInProjects.length}{' '}
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
            <DrawerTitle className="flex items-center gap-2">
              {viewingMemory?.name}
              {viewingMemory?.isBuiltIn && (
                <Badge variant="secondary">Built-in</Badge>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {viewingMemory?.description || viewingMemory?.fileName}
            </DrawerDescription>
          </DrawerHeader>
          {viewingMemory && (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <pre className="whitespace-pre-wrap font-mono text-xs">{viewingMemory.content}</pre>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
