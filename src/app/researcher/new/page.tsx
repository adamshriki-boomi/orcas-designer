'use client';

import { useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResearcherForm } from '@/hooks/use-researcher-form';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories, COMPANY_CONTEXT_MEMORY_ID, PRODUCT_CONTEXT_MEMORY_IDS } from '@/hooks/use-shared-memories';
import { useAuth } from '@/contexts/auth-context';
import { createClient } from '@/lib/supabase';
import { generateId } from '@/lib/id';
import { researcherProjectToRow } from '@/lib/researcher-utils';
import {
  RESEARCHER_WIZARD_STEPS,
  RESEARCHER_STEP_GROUPS,
  RESEARCH_TYPE_INFO,
  getMethodById,
} from '@/lib/researcher-constants';
import { BUILT_IN_COMPANY_CONTEXT } from '@/lib/constants';
import { isFieldFilled } from '@/lib/validators';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { StepResearchType } from '@/components/researcher/wizard/step-research-type';
import { StepProductContext } from '@/components/researcher/wizard/step-product-context';
import { StepResearchPurpose } from '@/components/researcher/wizard/step-research-purpose';
import { StepTargetAudience } from '@/components/researcher/wizard/step-target-audience';
import { StepSuccessCriteria } from '@/components/researcher/wizard/step-success-criteria';
import { StepMethodSelection } from '@/components/researcher/wizard/step-method-selection';
import { StepDataUpload } from '@/components/researcher/wizard/step-data-upload';
import { StepSkillsMemories } from '@/components/researcher/wizard/step-skills-memories';
import { StepReviewRun } from '@/components/researcher/wizard/step-review-run';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { SectionLoader } from '@/components/ui/loader';
import { Play } from 'lucide-react';
import type { ResearcherConfig, ResearchProjectType } from '@/lib/researcher-types';

import type { FormFieldData } from '@/lib/types';

function fieldSummary(field: FormFieldData): string {
  if (field.inputType === 'text' && field.textValue.trim()) return field.textValue.trim();
  if (field.inputType === 'url' && field.urlValue.trim()) return `[URL: ${field.urlValue.trim()}]`;
  if (field.inputType === 'file' && field.files.length > 0) return `[File: ${field.files.map(f => f.name).join(', ')}]`;
  if (field.additionalContext?.trim()) return field.additionalContext.trim();
  return '';
}

function buildFramingDocument(
  researchType: ResearchProjectType,
  config: ResearcherConfig,
  selectedMethodIds: string[]
): string {
  const typeInfo = RESEARCH_TYPE_INFO[researchType];
  const lines: string[] = [];

  lines.push('# Research Framing Document');
  lines.push('');

  lines.push('## Research Type');
  lines.push(`**${typeInfo.label}** - ${typeInfo.description}`);
  lines.push('');

  if (config.researchPurpose.title) {
    lines.push(`## ${config.researchPurpose.title}`);
    if (config.researchPurpose.description) {
      lines.push(config.researchPurpose.description);
    }
    lines.push('');
  }

  if (config.researchPurpose.goals.length > 0) {
    lines.push('## Goals');
    config.researchPurpose.goals.forEach((goal, i) => {
      if (goal.trim()) {
        lines.push(`${i + 1}. ${goal}`);
      }
    });
    lines.push('');
  }

  const productSummary = fieldSummary(config.productContext.productInfo);
  const featureSummary = fieldSummary(config.productContext.featureInfo);
  const additionalSummary = fieldSummary(config.productContext.additionalContext);
  if (config.productContext.companyAdditionalContext || productSummary || featureSummary) {
    lines.push('## Product Context');
    if (config.productContext.companyAdditionalContext) {
      lines.push('### Company');
      lines.push(config.productContext.companyAdditionalContext);
      lines.push('');
    }
    if (productSummary) {
      lines.push('### Product');
      lines.push(productSummary);
      lines.push('');
    }
    if (featureSummary) {
      lines.push('### Feature');
      lines.push(featureSummary);
      lines.push('');
    }
    if (additionalSummary) {
      lines.push('### Additional Context');
      lines.push(additionalSummary);
      lines.push('');
    }
  }

  if (config.targetAudience.description || config.targetAudience.segments.length > 0) {
    lines.push('## Target Audience');
    if (config.targetAudience.description) {
      lines.push(config.targetAudience.description);
      lines.push('');
    }
    if (config.targetAudience.segments.length > 0) {
      lines.push(`**Segments:** ${config.targetAudience.segments.join(', ')}`);
      lines.push('');
    }
  }

  if (selectedMethodIds.length > 0) {
    lines.push('## Selected Methods');
    selectedMethodIds.forEach((id) => {
      const method = getMethodById(id);
      if (method) {
        lines.push(`- **${method.name}** (${method.mode}) - ${method.shortDescription}`);
      }
    });
    lines.push('');
  }

  if (config.successCriteria.length > 0) {
    lines.push('## Success Criteria');
    config.successCriteria.forEach((c) => {
      if (c.metric.trim()) {
        lines.push(`- **${c.metric}**: ${c.target || 'Not set'}`);
      }
    });
    lines.push('');
  }

  return lines.join('\n');
}

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const currentStep = Number(searchParams.get('step') ?? '0');
  const { sharedSkills, isLoading: skillsLoading } = useSharedSkills();
  const { sharedMemories, isLoading: memoriesLoading } = useSharedMemories();

  const {
    formData,
    setName,
    setResearchType,
    setProductContext,
    setResearchPurpose,
    setTargetAudience,
    setSuccessCriteria,
    setSelectedMethods,
    setDataUpload,
    setSharedSkills,
    setCustomSkills,
    setSharedMemories,
    setCustomMemories,
  } = useResearcherForm();

  const setStep = useCallback(
    (step: number) => {
      router.replace(`/researcher/new?step=${step}`);
    },
    [router]
  );

  const { canProceed, validationMessage } = (() => {
    const step = RESEARCHER_WIZARD_STEPS[currentStep];
    if (!step?.required) return { canProceed: true, validationMessage: null };
    switch (currentStep) {
      case 0: {
        const ok = !!formData.researchType;
        return { canProceed: ok, validationMessage: ok ? null : 'Select a research type to continue' };
      }
      case 1: {
        const ctx = formData.config.productContext;
        const hasProductMemory = formData.selectedSharedMemoryIds.some(id =>
          PRODUCT_CONTEXT_MEMORY_IDS.includes(id)
        );
        const ok = hasProductMemory || isFieldFilled(ctx.productInfo) || isFieldFilled(ctx.featureInfo);
        return { canProceed: ok, validationMessage: ok ? null : 'Add product info or select a product memory to continue' };
      }
      case 2: {
        const ok = formData.config.researchPurpose.title.trim().length > 0;
        return { canProceed: ok, validationMessage: ok ? null : 'Add a research title to continue' };
      }
      case 3: {
        const ok = formData.config.targetAudience.description.trim().length > 0;
        return { canProceed: ok, validationMessage: ok ? null : 'Describe your target audience to continue' };
      }
      case 5: {
        const ok = formData.selectedMethodIds.length > 0;
        return { canProceed: ok, validationMessage: ok ? null : 'Select at least one research method' };
      }
      default:
        return { canProceed: true, validationMessage: null };
    }
  })();

  const completedSteps = useMemo(() => {
    const set = new Set<number>();
    // 0: Research type — always has default
    if (formData.researchType) set.add(0);
    // 1: Product context
    const ctx = formData.config.productContext;
    const hasProductMemory = formData.selectedSharedMemoryIds.some(id =>
      PRODUCT_CONTEXT_MEMORY_IDS.includes(id)
    );
    if (hasProductMemory || isFieldFilled(ctx.productInfo) || isFieldFilled(ctx.featureInfo)) set.add(1);
    // 2: Research purpose
    if (formData.config.researchPurpose.title.trim()) set.add(2);
    // 3: Target audience
    if (formData.config.targetAudience.description.trim()) set.add(3);
    // 4: Success criteria
    if (formData.config.successCriteria.some((c) => c.metric.trim())) set.add(4);
    // 5: Methods
    if (formData.selectedMethodIds.length > 0) set.add(5);
    // 6: Data upload
    if (formData.config.dataUpload.files.length > 0 || formData.config.dataUpload.textData.trim()) set.add(6);
    // 7: Skills & memories
    if (
      (formData.selectedSharedSkillIds?.length ?? 0) > 0 ||
      (formData.customSkills?.length ?? 0) > 0 ||
      (formData.selectedSharedMemoryIds?.length ?? 0) > 0 ||
      (formData.customMemories?.length ?? 0) > 0
    ) set.add(7);
    // 8: Review — always visitable
    return set;
  }, [formData]);

  const handleSave = async () => {
    try {
      const id = generateId();
      const name = formData.name || 'Untitled Research';
      const framingDocument = buildFramingDocument(
        formData.researchType,
        formData.config,
        formData.selectedMethodIds
      );

      const projectData = {
        ...formData,
        id,
        name,
        status: 'draft' as const,
        framingDocument,
      };

      const row = researcherProjectToRow(projectData, user!.id);
      row.id = id;

      const supabase = createClient();
      const { error } = await supabase.from('researcher_projects').insert(row as never);
      if (error) throw error;

      // Kick off AI research execution
      const { error: startError } = await supabase.functions.invoke('researcher-start', {
        body: { projectId: id },
      });
      if (startError) {
        toast.error('Project created but research could not start. You can retry from the project page.');
      } else {
        toast.success('Research started');
      }

      router.push(`/researcher/placeholder?_id=${encodeURIComponent(id)}`);
    } catch {
      toast.error('Unable to create research project');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepResearchType
            researchType={formData.researchType}
            onResearchTypeChange={setResearchType}
          />
        );
      case 1: {
        const productMemories = sharedMemories.filter(m =>
          PRODUCT_CONTEXT_MEMORY_IDS.includes(m.id)
        );
        return (
          <StepProductContext
            productContext={formData.config.productContext}
            onChange={setProductContext}
            builtInCompanyContent={BUILT_IN_COMPANY_CONTEXT}
            productMemories={productMemories}
            selectedProductMemoryIds={formData.selectedSharedMemoryIds.filter(id =>
              PRODUCT_CONTEXT_MEMORY_IDS.includes(id)
            )}
            onSelectedProductMemoryIdsChange={(ids) => {
              const nonProductIds = formData.selectedSharedMemoryIds.filter(
                id => !PRODUCT_CONTEXT_MEMORY_IDS.includes(id)
              );
              setSharedMemories([...nonProductIds, ...ids]);
            }}
          />
        );
      }
      case 2:
        return (
          <StepResearchPurpose
            purpose={formData.config.researchPurpose}
            onChange={setResearchPurpose}
          />
        );
      case 3:
        return (
          <StepTargetAudience
            audience={formData.config.targetAudience}
            onChange={setTargetAudience}
          />
        );
      case 4:
        return (
          <StepSuccessCriteria
            criteria={formData.config.successCriteria}
            onChange={setSuccessCriteria}
          />
        );
      case 5:
        return (
          <StepMethodSelection
            selectedMethodIds={formData.selectedMethodIds}
            researchType={formData.researchType}
            onMethodsChange={setSelectedMethods}
          />
        );
      case 6:
        return (
          <StepDataUpload
            dataUpload={formData.config.dataUpload}
            onChange={setDataUpload}
          />
        );
      case 7:
        return (
          <StepSkillsMemories
            sharedSkills={sharedSkills}
            selectedSharedSkillIds={formData.selectedSharedSkillIds}
            onSharedSkillsChange={setSharedSkills}
            customSkills={formData.customSkills}
            onCustomSkillsChange={setCustomSkills}
            sharedMemories={sharedMemories}
            selectedSharedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSharedMemoriesChange={setSharedMemories}
            customMemories={formData.customMemories ?? []}
            onCustomMemoriesChange={setCustomMemories}
            lockedMemoryIds={[COMPANY_CONTEXT_MEMORY_ID]}
          />
        );
      case 8:
        return (
          <StepReviewRun
            researchType={formData.researchType}
            config={formData.config}
            selectedMethodIds={formData.selectedMethodIds}
          />
        );
      default:
        return null;
    }
  };

  if (skillsLoading || memoriesLoading) {
    return (
      <>
        <Header title="New Research" description="Configure your UX research project" />
        <Breadcrumbs items={[
          { label: 'Researcher', href: '/researcher' },
          { label: 'New Research' },
        ]} />
        <PageContainer wide>
          <SectionLoader label="Loading research data..." />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="New Research" description="Configure your UX research project" />
      <Breadcrumbs items={[
        { label: 'Researcher', href: '/researcher' },
        { label: 'New Research' },
      ]} />
      <PageContainer wide>
        <div className="mb-6 max-w-md">
          <Input
            label="Research Name"
            type="text"
            value={formData.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Research Project"
          />
        </div>
        <WizardShell
          steps={RESEARCHER_WIZARD_STEPS}
          stepGroups={RESEARCHER_STEP_GROUPS}
          currentStep={currentStep}
          onStepChange={setStep}
          canProceed={canProceed}
          validationMessage={validationMessage}
          onSave={handleSave}
          saveLabel="Run Research"
          saveIcon={<Play className="size-4" />}
          completedSteps={completedSteps}
        >
          {renderStep()}
        </WizardShell>
      </PageContainer>
    </>
  );
}

export default function NewResearchPage() {
  return (
    <Suspense fallback={<SectionLoader />}>
      <WizardContent />
    </Suspense>
  );
}
