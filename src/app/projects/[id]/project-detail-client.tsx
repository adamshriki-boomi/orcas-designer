'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, BookOpen, FileText, Wrench, Trash2 } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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
import type { FormFieldData } from '@/lib/types';

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

interface ProjectDetailClientProps {
  id: string;
}

export default function ProjectDetailClient({ id }: ProjectDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Resolve the real project ID: prefer _id query param (from 404 redirect
  // or in-app navigation), then extract from pathname, fallback to prop.
  const actualId = useMemo(() => {
    const queryId = searchParams.get('_id');
    if (queryId) return queryId;
    const last = pathname.split('/').pop();
    return last && last !== 'placeholder' ? last : id;
  }, [searchParams, pathname, id]);

  // Clean up the URL so it shows /projects/<actualId> instead of /projects/placeholder?_id=...
  useEffect(() => {
    if (searchParams.get('_id') || pathname.endsWith('/placeholder')) {
      window.history.replaceState(null, '', `/orcas-designer/projects/${actualId}`);
    }
  }, [actualId, searchParams, pathname]);

  const { project, updateProject } = useProject(actualId);
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();
  const { prompt } = usePromptGenerator(project, sharedSkills, sharedMemories);
  const { copied, copy } = useCopyToClipboard();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (project === undefined) {
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

  if (project === null) {
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

  const handleRegeneratePrompt = async () => {
    try {
      await updateProject({ generatedPrompt: prompt });
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
      await db.projects.delete(id);
      setDeleteOpen(false);
      router.push('/projects');
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const selectedSharedSkills = sharedSkills.filter((s) =>
    project.selectedSharedSkillIds.includes(s.id)
  );

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

  return (
    <>
      <FadeIn>
        <Header
          title={project.name}
          action={
            <div className="flex items-center gap-2">
              <Link href="/projects" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          }
        />
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
                Skills
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                <ProjectHeader
                  project={project}
                  onRegeneratePrompt={handleRegeneratePrompt}
                />
                <FieldsGrid
                  project={project}
                  onEditField={(fieldKey) => setEditingField(fieldKey)}
                  sharedMemories={sharedMemories}
                />
              </div>
            </TabsContent>

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

            <TabsContent value="skills">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-3">Shared Skills</h3>
                  {selectedSharedSkills.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {selectedSharedSkills.map((skill) => (
                        <Card key={skill.id} size="sm">
                          <CardHeader>
                            <CardTitle className="text-sm">{skill.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{skill.description}</p>
                            <Badge variant="outline" className="mt-2">
                              {skill.type === 'url' ? 'URL' : 'File'}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No shared skills selected.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-medium mb-3">Custom Skills</h3>
                  {project.customSkills.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {project.customSkills.map((skill) => (
                        <Card key={skill.id} size="sm">
                          <CardHeader>
                            <CardTitle className="text-sm">{skill.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant="outline">
                              {skill.type === 'url' ? 'URL' : 'File'}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No custom skills added.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </PageContainer>
      </FadeIn>

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
    </>
  );
}
