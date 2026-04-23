'use client';

import { useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardForm } from '@/hooks/use-wizard-form';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import {
  useSharedMemories,
  PRODUCT_CONTEXT_MEMORY_IDS,
  UX_WRITING_MEMORY_IDS,
} from '@/hooks/use-shared-memories';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { promptToRow } from '@/hooks/use-prompts';
import { generateId } from '@/lib/id';
import { isFieldFilled } from '@/lib/validators';
import {
  WIZARD_STEPS,
  PROMPT_GENERATOR_STEP_GROUPS,
  BUILT_IN_COMPANY_CONTEXT,
  BUILT_IN_UX_WRITING_MEMORY_ID,
  WIZARD_LOCKED_MEMORY_IDS,
} from '@/lib/constants';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { StepCompanyProduct } from '@/components/wizard/step-company-product';
import { StepFeatureDefinition } from '@/components/wizard/step-feature-definition';
import { StepCurrentState } from '@/components/wizard/step-current-state';
import { StepDesignSystem } from '@/components/wizard/step-design-system';
import { StepVoiceWriting } from '@/components/wizard/step-voice-writing';
import { StepDesignProducts } from '@/components/wizard/step-design-products';
import { StepSkillsMemories } from '@/components/wizard/step-skills-memories';
import { StepReviewGenerate } from '@/components/wizard/step-review-generate';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import type { FormFieldData } from '@/lib/types';
import { SectionLoader } from '@/components/ui/loader';

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
    setField,
    setCurrentImpl,
    setFeatureDefinition,
    setDesignProducts,
    setSharedSkills,
    setCustomSkills,
    setSharedMemories,
    setCustomMemories,
  } = useWizardForm();

  const setStep = useCallback(
    (step: number) => {
      router.replace(`/prompt-generator/new?step=${step}`);
    },
    [router],
  );

  const { canProceed, validationMessage } = useMemo(() => {
    const step = WIZARD_STEPS[currentStep];
    if (!step?.required) return { canProceed: true, validationMessage: null };
    switch (currentStep) {
      case 0: {
        const ok =
          isFieldFilled(formData.productInfo) ||
          isFieldFilled(formData.companyInfo) ||
          (formData.selectedSharedMemoryIds ?? []).some((id) =>
            PRODUCT_CONTEXT_MEMORY_IDS.includes(id),
          );
        return {
          canProceed: ok,
          validationMessage: ok
            ? null
            : 'Add company or product context (or select the Rivery Context memory) to continue.',
        };
      }
      case 1: {
        const ok = formData.featureDefinition.name.trim().length > 0;
        return {
          canProceed: ok,
          validationMessage: ok ? null : 'Give the feature a name to continue.',
        };
      }
      case 5: {
        const ok = formData.designProducts.products.length > 0;
        return {
          canProceed: ok,
          validationMessage: ok ? null : 'Pick at least one design output to continue.',
        };
      }
      default:
        return { canProceed: true, validationMessage: null };
    }
  }, [currentStep, formData]);

  const completedSteps = useMemo(() => {
    const set = new Set<number>();
    // Step 0 (Company & Product)
    if (
      isFieldFilled(formData.productInfo) ||
      isFieldFilled(formData.companyInfo) ||
      (formData.selectedSharedMemoryIds ?? []).some((id) =>
        PRODUCT_CONTEXT_MEMORY_IDS.includes(id),
      )
    ) {
      set.add(0);
    }
    // Step 1 (Feature Definition) — completion = has a name
    if (formData.featureDefinition.name.trim().length > 0) set.add(1);
    // Step 2 (Feature Information) — completion = any sub-section filled
    if (
      isFieldFilled(formData.featureInfo) ||
      isFieldFilled(formData.currentImplementation) ||
      formData.currentImplementation.figmaLinks.length > 0 ||
      isFieldFilled(formData.uxResearch) ||
      isFieldFilled(formData.prototypeSketches)
    ) {
      set.add(2);
    }
    // Step 3 (Design System) — Exosphere is always attached; no user input
    // possible, so the step is always "complete".
    set.add(3);
    // Step 4 (Voice & Writing)
    if (
      isFieldFilled(formData.uxWriting) ||
      (formData.selectedSharedMemoryIds ?? []).some((id) =>
        UX_WRITING_MEMORY_IDS.includes(id),
      )
    ) {
      set.add(4);
    }
    // Step 5 (Design Products) — completion = at least one product chosen
    if (formData.designProducts.products.length > 0) set.add(5);
    // Step 6 (Skills & Memories) — always complete (mandatory skills auto-attach)
    set.add(6);
    // Step 7 (Review & Generate) is the terminal step; not "completed" until generation
    return set;
  }, [formData]);

  const handleSave = async () => {
    try {
      const id = generateId();
      const projectData = {
        ...formData,
        id,
        name: formData.name || 'Untitled Prompt',
      };
      // promptToRow packs the form data into row.data via its own formFields
      // constant — don't duplicate that list here.
      const row = promptToRow(projectData, user!.id);
      row.id = id;
      const supabase = createClient();
      const { error } = await supabase.from('prompts').insert(row as never);
      if (error) throw error;
      toast.success('Prompt saved — ready to generate with Opus 4.7');
      router.push(`/prompt-generator/placeholder?_id=${encodeURIComponent(id)}`);
    } catch {
      toast.error('Unable to save prompt');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: {
        const productMemories = sharedMemories.filter((m) =>
          PRODUCT_CONTEXT_MEMORY_IDS.includes(m.id),
        );
        return (
          <StepCompanyProduct
            companyData={formData.companyInfo}
            onCompanyChange={(d: FormFieldData) => setField('companyInfo', d)}
            productData={formData.productInfo}
            onProductChange={(d: FormFieldData) => setField('productInfo', d)}
            builtInCompanyContent={BUILT_IN_COMPANY_CONTEXT}
            productMemories={productMemories}
            selectedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSelectedMemoryIdsChange={setSharedMemories}
          />
        );
      }
      case 1:
        return (
          <StepFeatureDefinition
            data={formData.featureDefinition}
            onChange={setFeatureDefinition}
          />
        );
      case 2:
        return (
          <StepCurrentState
            mode={formData.featureDefinition.mode}
            featureInfo={formData.featureInfo}
            onFeatureInfoChange={(d: FormFieldData) => setField('featureInfo', d)}
            current={formData.currentImplementation}
            onCurrentChange={setCurrentImpl}
            research={formData.uxResearch}
            onResearchChange={(d: FormFieldData) => setField('uxResearch', d)}
            prototypes={formData.prototypeSketches}
            onPrototypesChange={(d: FormFieldData) => setField('prototypeSketches', d)}
          />
        );
      case 3:
        return <StepDesignSystem />;
      case 4: {
        const voiceMemories = sharedMemories.filter((m) =>
          UX_WRITING_MEMORY_IDS.includes(m.id),
        );
        return (
          <StepVoiceWriting
            data={formData.uxWriting}
            onChange={(d: FormFieldData) => setField('uxWriting', d)}
            voiceMemories={voiceMemories}
            selectedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSelectedMemoryIdsChange={setSharedMemories}
            lockedMemoryIds={[BUILT_IN_UX_WRITING_MEMORY_ID]}
          />
        );
      }
      case 5:
        return (
          <StepDesignProducts
            data={formData.designProducts}
            onChange={setDesignProducts}
          />
        );
      case 6:
        return (
          <StepSkillsMemories
            formData={formData}
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
            lockedMemoryIds={WIZARD_LOCKED_MEMORY_IDS}
          />
        );
      case 7:
        return (
          <StepReviewGenerate
            formData={formData}
            sharedSkills={sharedSkills}
            sharedMemories={sharedMemories}
            onSave={handleSave}
          />
        );
      default:
        return null;
    }
  };

  if (skillsLoading || memoriesLoading) {
    return (
      <>
        <Header title="New Prompt" description="Generate a Claude Code brief with AI" />
        <Breadcrumbs
          items={[
            { label: 'Prompt Generator', href: '/prompt-generator' },
            { label: 'New Prompt' },
          ]}
        />
        <PageContainer wide>
          <SectionLoader label="Loading prompt data..." />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="New Prompt" description="Generate a Claude Code brief with AI" />
      <Breadcrumbs
        items={[
          { label: 'Prompt Generator', href: '/prompt-generator' },
          { label: 'New Prompt' },
        ]}
      />
      <PageContainer wide>
        <div className="mb-6 max-w-md">
          <Input
            label="Prompt Name"
            type="text"
            value={formData.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Feature Design"
          />
        </div>
        <WizardShell
          steps={WIZARD_STEPS}
          stepGroups={PROMPT_GENERATOR_STEP_GROUPS}
          currentStep={currentStep}
          onStepChange={setStep}
          canProceed={canProceed}
          validationMessage={validationMessage}
          onSave={handleSave}
          completedSteps={completedSteps}
        >
          {renderStep()}
        </WizardShell>
      </PageContainer>
    </>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<SectionLoader />}>
      <WizardContent />
    </Suspense>
  );
}
