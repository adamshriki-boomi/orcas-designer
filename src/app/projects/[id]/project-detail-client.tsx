'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, BookOpen, FileText, Wrench, Settings, Brain, ExternalLink, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useProject } from '@/hooks/use-project';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories, PRODUCT_CONTEXT_MEMORY_IDS, COMPANY_CONTEXT_MEMORY_ID } from '@/hooks/use-shared-memories';
import { usePromptGenerator } from '@/hooks/use-prompt-generator';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { FadeIn } from '@/components/ui/motion';
import { ProjectHeader } from '@/components/project-detail/project-header';
import { FieldsGrid } from '@/components/project-detail/fields-grid';
import { PromptPreview } from '@/components/project-detail/prompt-preview';
import { EditFieldDrawer, type ContextMemory } from '@/components/project-detail/edit-field-drawer';
import { SkillCard } from '@/components/skills/skill-card';
import { CustomSkillAdder } from '@/components/skills/custom-skill-adder';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { db } from '@/lib/db';
import { getActiveSkillsForProject } from '@/lib/skill-filter';
import { generateId } from '@/lib/id';
import { cn } from '@/lib/utils';
import type { FormFieldData, InteractionLevel, ImplementationMode, CustomMemory, SharedSkill, CustomSkill, SharedMemory } from '@/lib/types';
import type { MandatorySkill } from '@/lib/constants';

const FIELD_LABELS: Record<string, string> = {
  companyInfo: 'Company Info',
  productInfo: 'Product Info',
  featureInfo: 'Feature Info',
  figmaFileLink: 'Figma File',
  designSystemStorybook: 'Storybook',
  designSystemNpm: 'NPM Package',
  designSystemFigma: 'Design System Figma',
  prototypeSketches: 'Prototypes & Sketches',
};

const INTERACTION_LEVELS: { value: InteractionLevel; label: string; description: string }[] = [
  { value: 'static', label: 'Static Mockups', description: 'High-fidelity static HTML pages with no interactivity' },
  { value: 'click-through', label: 'Click-through Flows', description: 'Static pages with basic page-to-page navigation' },
  { value: 'full-prototype', label: 'Full Prototype', description: 'Interactive prototype with animations and micro-interactions' },
];

const IMPLEMENTATION_MODES: { value: ImplementationMode; label: string; description: string }[] = [
  { value: 'add-on-top', label: 'Add on Top', description: 'Build new elements on top of the existing implementation' },
  { value: 'redesign', label: 'Redesign', description: 'Create a fresh design from scratch using current implementation as reference' },
];

interface ProjectDetailClientProps {
  id: string;
}

export default function ProjectDetailClient({ id }: ProjectDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const actualId = useMemo(() => {
    const queryId = searchParams.get('_id');
    return queryId && id === 'placeholder' ? queryId : id;
  }, [searchParams, id]);

  useEffect(() => {
    if (searchParams.get('_id')) {
      window.history.replaceState(null, '', `${process.env.NEXT_PUBLIC_BASE_PATH}/projects/${actualId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { project, isLoading, updateProject } = useProject(actualId);
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();
  const { prompt } = usePromptGenerator(project, sharedSkills, sharedMemories);
  const { copied, copy } = useCopyToClipboard();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editInteractionOpen, setEditInteractionOpen] = useState(false);
  const [editImplModeOpen, setEditImplModeOpen] = useState(false);
  const [draftInteraction, setDraftInteraction] = useState<InteractionLevel>('static');
  const [draftImplMode, setDraftImplMode] = useState<ImplementationMode>('add-on-top');

  // View drawer state for skills & memories
  const [viewSkillDrawer, setViewSkillDrawer] = useState<{ open: boolean; skill: MandatorySkill | SharedSkill | CustomSkill | null }>({ open: false, skill: null });
  const [viewMemoryDrawer, setViewMemoryDrawer] = useState<{ open: boolean; memory: SharedMemory | CustomMemory | null }>({ open: false, memory: null });

  // Custom memory form state
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [memoryName, setMemoryName] = useState('');
  const [memoryContent, setMemoryContent] = useState('');
  const memoryFileRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <>
        <Header title="" />
        <PageContainer>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-72 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header title="Not Found" />
        <PageContainer>
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Project not found.</p>
            <Link href="/projects" className={buttonVariants({ variant: 'outline' })}>
              <ArrowLeft className="size-4" />
              Back to Projects
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const handleRename = async (name: string) => {
    try {
      await updateProject({ name });
      toast.success('Project renamed');
    } catch {
      toast.error('Failed to rename project');
    }
  };

  const handleRegeneratePrompt = async () => {
    try {
      await updateProject({
        generatedPrompt: prompt,
        regenerationCount: (project.regenerationCount ?? 0) + 1,
      });
      toast.success('Prompt regenerated');
    } catch {
      toast.error('Failed to regenerate prompt');
    }
  };

  const handleSaveField = async (fieldKey: string, data: FormFieldData) => {
    try {
      await updateProject({ [fieldKey]: data });
      toast.success('Field updated');
    } catch {
      toast.error('Failed to update field');
    }
  };

  const handleCopyPrompt = async () => {
    try {
      const promptToUse = project.generatedPrompt || prompt;
      await copy(promptToUse);
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleDelete = async () => {
    try {
      await db.projects.delete(actualId);
      setDeleteOpen(false);
      router.push('/projects');
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleSaveInteractionLevel = async () => {
    try {
      await updateProject({ interactionLevel: draftInteraction });
      setEditInteractionOpen(false);
      toast.success('Interaction level updated');
    } catch {
      toast.error('Failed to update interaction level');
    }
  };

  const handleSaveImplMode = async () => {
    try {
      await updateProject({
        currentImplementation: { ...project.currentImplementation, implementationMode: draftImplMode },
      });
      setEditImplModeOpen(false);
      toast.success('Implementation mode updated');
    } catch {
      toast.error('Failed to update implementation mode');
    }
  };

  const handleAddCustomMemory = () => {
    if (!memoryName.trim() || !memoryContent.trim()) return;
    const newMemory: CustomMemory = {
      id: generateId(),
      name: memoryName.trim(),
      content: memoryContent,
    };
    updateProject({ customMemories: [...project.customMemories, newMemory] });
    setMemoryName('');
    setMemoryContent('');
    setShowMemoryForm(false);
    if (memoryFileRef.current) memoryFileRef.current.value = '';
    toast.success('Custom memory added');
  };

  const handleRemoveCustomMemory = (memoryId: string) => {
    updateProject({ customMemories: project.customMemories.filter((m) => m.id !== memoryId) });
    toast.success('Custom memory removed');
  };

  const handleMemoryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMemoryContent(event.target?.result as string);
      if (!memoryName) setMemoryName(file.name.replace(/\.md$/, ''));
    };
    reader.readAsText(file);
  };

  const selectedSharedSkills = sharedSkills.filter((s) =>
    project.selectedSharedSkillIds.includes(s.id)
  );

  const selectedSharedMemories = sharedMemories.filter((m) =>
    (project.selectedSharedMemoryIds ?? []).includes(m.id)
  );

  const activeBuiltInSkills = project ? getActiveSkillsForProject(project) : [];

  const editingFieldData = editingField
    ? (project[editingField as keyof typeof project] as FormFieldData)
    : null;

  function getContextMemories(fieldKey: string): ContextMemory[] {
    if (fieldKey === 'companyInfo') {
      const mem = sharedMemories.find((m) => m.id === COMPANY_CONTEXT_MEMORY_ID);
      return mem ? [{ memory: mem, locked: true }] : [];
    }
    if (fieldKey === 'productInfo') {
      return sharedMemories
        .filter((m) => PRODUCT_CONTEXT_MEMORY_IDS.includes(m.id))
        .map((memory) => ({ memory, locked: false }));
    }
    return [];
  }

  function getSkillRepo(skill: MandatorySkill | SharedSkill | CustomSkill): string | null {
    if ('repoUrl' in skill) return skill.repoUrl;
    if ('urlValue' in skill && skill.type === 'url' && skill.urlValue) return skill.urlValue;
    return null;
  }

  return (
    <>
      <FadeIn>
        <Header title={project.name} />
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]} />
        <PageContainer>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">
                <BookOpen className="size-3.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="prompt">
                <FileText className="size-3.5" />
                Prompt
              </TabsTrigger>
              <TabsTrigger value="skills">
                <Wrench className="size-3.5" />
                Skills & Memories
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="size-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* ===== Overview Tab ===== */}
            <TabsContent value="overview">
              <div className="space-y-6">
                <ProjectHeader project={project} onRename={handleRename} />
                <FieldsGrid
                  project={project}
                  onEditField={(fieldKey) => setEditingField(fieldKey)}
                  onEditInteractionLevel={() => {
                    setDraftInteraction(project.interactionLevel);
                    setEditInteractionOpen(true);
                  }}
                  onEditImplementationMode={() => {
                    setDraftImplMode(project.currentImplementation.implementationMode);
                    setEditImplModeOpen(true);
                  }}
                  sharedMemories={sharedMemories}
                />
              </div>
            </TabsContent>

            {/* ===== Prompt Tab ===== */}
            <TabsContent value="prompt">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Prompt</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRegeneratePrompt}>
                      <RefreshCw className="size-3.5" />
                      Regenerate
                    </Button>
                  </div>
                </div>
                <PromptPreview
                  prompt={project.generatedPrompt || prompt}
                  onCopy={handleCopyPrompt}
                  copied={copied}
                />
              </div>
            </TabsContent>

            {/* ===== Skills & Memories Tab ===== */}
            <TabsContent value="skills">
              <div className="space-y-8">
                {/* Built-in Skills */}
                <section>
                  <h3 className="text-base font-medium mb-3">Built-in Skills</h3>
                  {activeBuiltInSkills.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {activeBuiltInSkills.map((skill) => (
                        <SkillCard
                          key={skill.name}
                          skill={skill}
                          locked
                          onView={() => setViewSkillDrawer({ open: true, skill })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No built-in skills active for this project configuration.</p>
                  )}
                </section>

                {/* Shared Skills */}
                <section>
                  <h3 className="text-base font-medium mb-3">Shared Skills</h3>
                  {selectedSharedSkills.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedSharedSkills.map((skill) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          onView={() => setViewSkillDrawer({ open: true, skill })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No shared skills selected.</p>
                  )}
                </section>

                {/* Custom Skills */}
                <section>
                  <h3 className="text-base font-medium mb-3">Custom Skills</h3>
                  <CustomSkillAdder
                    skills={project.customSkills}
                    onChange={(skills) => updateProject({ customSkills: skills })}
                  />
                </section>

                {/* Shared Memories */}
                <section>
                  <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                    <Brain className="size-4" />
                    Shared Memories
                  </h3>
                  {selectedSharedMemories.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedSharedMemories.map((memory) => (
                        <Card
                          key={memory.id}
                          size="sm"
                          className="cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:scale-[1.01]"
                          onClick={() => setViewMemoryDrawer({ open: true, memory })}
                        >
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Brain className="size-3.5 text-muted-foreground" />
                              {memory.name}
                              {memory.isBuiltIn && <Badge variant="secondary">Built-in</Badge>}
                            </CardTitle>
                          </CardHeader>
                          {memory.description && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-2">{memory.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No shared memories selected.</p>
                  )}
                </section>

                {/* Custom Memories */}
                <section>
                  <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                    <Brain className="size-4" />
                    Custom Memories
                  </h3>
                  {project.customMemories.length > 0 && (
                    <div className="grid gap-2 mb-3">
                      {project.customMemories.map((memory) => (
                        <Card key={memory.id} size="sm">
                          <CardContent className="flex items-center justify-between">
                            <span
                              className="text-sm font-medium cursor-pointer hover:underline"
                              onClick={() => setViewMemoryDrawer({ open: true, memory })}
                            >
                              {memory.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemoveCustomMemory(memory.id)}
                            >
                              <Trash2 className="text-destructive" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {showMemoryForm ? (
                    <Card size="sm">
                      <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="custom-memory-file">Upload .md file</Label>
                          <Input
                            id="custom-memory-file"
                            ref={memoryFileRef}
                            type="file"
                            accept=".md,.markdown,.txt"
                            onChange={handleMemoryFileUpload}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="custom-memory-name">Name</Label>
                          <Input
                            id="custom-memory-name"
                            placeholder="Memory name"
                            value={memoryName}
                            onChange={(e) => setMemoryName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="custom-memory-content">Content</Label>
                          <Textarea
                            id="custom-memory-content"
                            placeholder="Paste markdown content or upload a file..."
                            value={memoryContent}
                            onChange={(e) => setMemoryContent(e.target.value)}
                            rows={6}
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddCustomMemory}
                            disabled={!memoryName.trim() || !memoryContent.trim()}
                          >
                            <Upload className="size-4" />
                            Add Memory
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setShowMemoryForm(false); setMemoryName(''); setMemoryContent(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowMemoryForm(true)}>
                      <Plus />
                      Add Custom Memory
                    </Button>
                  )}
                </section>
              </div>
            </TabsContent>

            {/* ===== Settings Tab ===== */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="rounded-lg border border-destructive/20 p-6">
                  <h3 className="text-base font-medium text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete a project, there is no going back. All project data will be permanently removed.
                  </p>
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-3.5" />
                    Delete Project
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </PageContainer>
      </FadeIn>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project and all its data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Edit Field Drawer ===== */}
      {editingField && editingFieldData && (
        <EditFieldDrawer
          open={!!editingField}
          onOpenChange={(open) => {
            if (!open) setEditingField(null);
          }}
          fieldKey={editingField}
          label={FIELD_LABELS[editingField] ?? editingField}
          data={editingFieldData}
          onSave={(data) => {
            handleSaveField(editingField, data);
            setEditingField(null);
          }}
          contextMemories={getContextMemories(editingField)}
          selectedMemoryIds={project.selectedSharedMemoryIds ?? []}
          onSelectedMemoryIdsChange={(ids) => updateProject({ selectedSharedMemoryIds: ids })}
        />
      )}

      {/* ===== Edit Interaction Level Drawer ===== */}
      <Drawer open={editInteractionOpen} onOpenChange={setEditInteractionOpen}>
        <DrawerContent width="25">
          <DrawerHeader>
            <DrawerTitle>Edit Interaction Level</DrawerTitle>
            <DrawerDescription>Choose the level of interactivity for the prototype output.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2 space-y-2">
            {INTERACTION_LEVELS.map((level) => (
              <Card
                key={level.value}
                size="sm"
                className={cn(
                  'cursor-pointer transition-all duration-150 hover:shadow-card-hover',
                  draftInteraction === level.value && 'ring-2 ring-primary'
                )}
                onClick={() => setDraftInteraction(level.value)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDraftInteraction(level.value); } }}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{level.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button onClick={handleSaveInteractionLevel}>Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ===== Edit Implementation Mode Drawer ===== */}
      <Drawer open={editImplModeOpen} onOpenChange={setEditImplModeOpen}>
        <DrawerContent width="25">
          <DrawerHeader>
            <DrawerTitle>Edit Implementation Mode</DrawerTitle>
            <DrawerDescription>Choose how to build relative to the existing implementation.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2 space-y-2">
            {IMPLEMENTATION_MODES.map((mode) => (
              <Card
                key={mode.value}
                size="sm"
                className={cn(
                  'cursor-pointer transition-all duration-150 hover:shadow-card-hover',
                  draftImplMode === mode.value && 'ring-2 ring-primary'
                )}
                onClick={() => setDraftImplMode(mode.value)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDraftImplMode(mode.value); } }}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{mode.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{mode.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button onClick={handleSaveImplMode}>Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ===== View Skill Drawer ===== */}
      <Drawer open={viewSkillDrawer.open} onOpenChange={(open) => { if (!open) setViewSkillDrawer({ open: false, skill: null }); }}>
        <DrawerContent width="25">
          <DrawerHeader>
            <DrawerTitle>{viewSkillDrawer.skill?.name ?? 'Skill'}</DrawerTitle>
          </DrawerHeader>
          {viewSkillDrawer.skill && (
            <div className="px-4 py-2 space-y-4">
              {'description' in viewSkillDrawer.skill && viewSkillDrawer.skill.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{viewSkillDrawer.skill.description}</p>
                </div>
              )}
              {'invocation' in viewSkillDrawer.skill && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Invocation</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{viewSkillDrawer.skill.invocation}</code>
                </div>
              )}
              {'category' in viewSkillDrawer.skill && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
                  <Badge variant="secondary">{viewSkillDrawer.skill.category}</Badge>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">GitHub Repository</p>
                {(() => {
                  const repo = getSkillRepo(viewSkillDrawer.skill);
                  return repo ? (
                    <a href={repo} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      {repo}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  );
                })()}
              </div>
            </div>
          )}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* ===== View Memory Drawer ===== */}
      <Drawer open={viewMemoryDrawer.open} onOpenChange={(open) => { if (!open) setViewMemoryDrawer({ open: false, memory: null }); }}>
        <DrawerContent width="25">
          <DrawerHeader>
            <DrawerTitle>{viewMemoryDrawer.memory?.name ?? 'Memory'}</DrawerTitle>
          </DrawerHeader>
          {viewMemoryDrawer.memory && (
            <div className="px-4 py-2 space-y-4">
              {'description' in viewMemoryDrawer.memory && viewMemoryDrawer.memory.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{viewMemoryDrawer.memory.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">GitHub Repository</p>
                <span className="text-sm text-muted-foreground">None</span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Content</p>
                <ScrollArea className="h-64 rounded-lg border">
                  <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-muted-foreground">
                    {viewMemoryDrawer.memory.content}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
