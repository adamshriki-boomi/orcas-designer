'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWizardForm } from '@/hooks/use-wizard-form';
import { useSharedSkills } from '@/hooks/use-shared-skills';
import { useSharedMemories, PRODUCT_CONTEXT_MEMORY_IDS } from '@/hooks/use-shared-memories';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { db } from '@/lib/db';
import { generateId } from '@/lib/id';
import { generatePrompt } from '@/lib/prompt-generator';
import { isFieldFilled } from '@/lib/validators';
import { WIZARD_STEPS, TOTAL_STEPS, BUILT_IN_COMPANY_CONTEXT } from '@/lib/constants';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { WizardShell } from '@/components/wizard/wizard-shell';
import { StepCompanyInfo } from '@/components/wizard/step-company-info';
import { StepProductInfo } from '@/components/wizard/step-product-info';
import { StepFeatureInfo } from '@/components/wizard/step-feature-info';
import { StepCurrentImpl } from '@/components/wizard/step-current-impl';
import { StepFigmaLink } from '@/components/wizard/step-figma-link';
import { StepDesignSystemStorybook } from '@/components/wizard/step-design-system-storybook';
import { StepDesignSystemNpm } from '@/components/wizard/step-design-system-npm';
import { StepDesignSystemFigma } from '@/components/wizard/step-design-system-figma';
import { StepPrototypes } from '@/components/wizard/step-prototypes';
import { StepOutputType } from '@/components/wizard/step-output-type';
import { StepAdvancedOptions } from '@/components/wizard/step-advanced-options';
import { StepSkills } from '@/components/wizard/step-skills';
import { StepMemories } from '@/components/wizard/step-memories';
import { StepReview } from '@/components/wizard/step-review';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import type { FormFieldData } from '@/lib/types';
import { Suspense } from 'react';

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStep = Number(searchParams.get('step') ?? '0');
  const { sharedSkills } = useSharedSkills();
  const { sharedMemories } = useSharedMemories();
  const { copied, copy } = useCopyToClipboard();

  const {
    formData,
    setName,
    setField,
    setCurrentImpl,
    setOutputType,
    setInteractionLevel,
    setOutputDirectory,
    setPromptMode,
    setAccessibilityLevel,
    setBrowserCompat,
    setExternalResources,
    setDesignDirection,
    setSharedSkills,
    setCustomSkills,
    setSharedMemories,
    setCustomMemories,
  } = useWizardForm();

  const setStep = useCallback(
    (step: number) => {
      router.replace(`/projects/new?step=${step}`);
    },
    [router]
  );

  const { canProceed, validationMessage } = (() => {
    const step = WIZARD_STEPS[currentStep];
    if (!step?.required) return { canProceed: true, validationMessage: null };
    switch (currentStep) {
      case 1: {
        const ok = isFieldFilled(formData.productInfo) || (formData.selectedSharedMemoryIds ?? []).some((id) => PRODUCT_CONTEXT_MEMORY_IDS.includes(id));
        return { canProceed: ok, validationMessage: ok ? null : 'Product info or a product context memory is required' };
      }
      case 2: {
        const ok = isFieldFilled(formData.featureInfo);
        return { canProceed: ok, validationMessage: ok ? null : 'Feature info is required' };
      }
      case 4: {
        const ok = formData.figmaFileLink.urlValue.trim().length > 0;
        return { canProceed: ok, validationMessage: ok ? null : 'Figma file link is required' };
      }
      case 9: {
        const ok = !!formData.interactionLevel;
        return { canProceed: ok, validationMessage: ok ? null : 'Please select an interaction level' };
      }
      default: return { canProceed: true, validationMessage: null };
    }
  })();

  const completedSteps = useMemo(() => {
    const set = new Set<number>();
    set.add(0); // Always completed — "Boomi Context" is locked/always included
    if (isFieldFilled(formData.productInfo) || (formData.selectedSharedMemoryIds ?? []).some((id) => PRODUCT_CONTEXT_MEMORY_IDS.includes(id))) set.add(1);
    if (isFieldFilled(formData.featureInfo)) set.add(2);
    if (isFieldFilled(formData.currentImplementation) || formData.currentImplementation.figmaLinks.length > 0) set.add(3);
    if (formData.figmaFileLink.urlValue.trim().length > 0) set.add(4);
    if (isFieldFilled(formData.designSystemStorybook)) set.add(5);
    if (isFieldFilled(formData.designSystemNpm)) set.add(6);
    if (isFieldFilled(formData.designSystemFigma)) set.add(7);
    if (isFieldFilled(formData.prototypeSketches)) set.add(8);
    if (formData.interactionLevel) set.add(9);
    // Advanced options — completed if any non-default value is set
    if (
      formData.accessibilityLevel !== 'none' ||
      formData.browserCompatibility.length > 1 ||
      !formData.externalResourcesAccessible ||
      formData.designDirection !== null
    ) set.add(10);
    set.add(11); // Always completed — mandatory skills are always included
    if ((formData.selectedSharedMemoryIds?.length ?? 0) > 0 || (formData.customMemories?.length ?? 0) > 0) set.add(12);
    if (formData.generatedPrompt) set.add(13);
    return set;
  }, [formData]);

  const handleSave = async () => {
    try {
      const id = generateId();
      const prompt = generatePrompt({ ...formData, id, name: formData.name || 'Untitled Project' }, sharedSkills, sharedMemories);
      const project = {
        ...formData,
        id,
        name: formData.name || 'Untitled Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedPrompt: prompt,
      };
      await db.projects.add(project);
      toast.success('Project saved!');
      router.push(`/projects/${id}`);
    } catch {
      toast.error('Failed to save project');
    }
  };

  const handleCopy = async () => {
    try {
      const prompt = generatePrompt(formData, sharedSkills, sharedMemories);
      await copy(prompt);
      toast.success('Prompt copied to clipboard!');
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepCompanyInfo data={formData.companyInfo} onChange={(d: FormFieldData) => setField('companyInfo', d)} builtInContent={BUILT_IN_COMPANY_CONTEXT} />;
      case 1: {
        const productMemories = sharedMemories.filter((m) => PRODUCT_CONTEXT_MEMORY_IDS.includes(m.id));
        return (
          <StepProductInfo
            data={formData.productInfo}
            onChange={(d: FormFieldData) => setField('productInfo', d)}
            productMemories={productMemories}
            selectedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSelectedMemoryIdsChange={setSharedMemories}
          />
        );
      }
      case 2:
        return <StepFeatureInfo data={formData.featureInfo} onChange={(d: FormFieldData) => setField('featureInfo', d)} />;
      case 3:
        return <StepCurrentImpl data={formData.currentImplementation} onChange={setCurrentImpl} />;
      case 4:
        return <StepFigmaLink data={formData.figmaFileLink} onChange={(d: FormFieldData) => setField('figmaFileLink', d)} />;
      case 5:
        return <StepDesignSystemStorybook data={formData.designSystemStorybook} onChange={(d: FormFieldData) => setField('designSystemStorybook', d)} />;
      case 6:
        return <StepDesignSystemNpm data={formData.designSystemNpm} onChange={(d: FormFieldData) => setField('designSystemNpm', d)} />;
      case 7:
        return <StepDesignSystemFigma data={formData.designSystemFigma} onChange={(d: FormFieldData) => setField('designSystemFigma', d)} />;
      case 8:
        return <StepPrototypes data={formData.prototypeSketches} onChange={(d: FormFieldData) => setField('prototypeSketches', d)} />;
      case 9:
        return (
          <StepOutputType
            interactionLevel={formData.interactionLevel}
            onInteractionLevelChange={setInteractionLevel}
            outputDirectory={formData.outputDirectory}
            onOutputDirectoryChange={setOutputDirectory}
            promptMode={formData.promptMode}
            onPromptModeChange={setPromptMode}
          />
        );
      case 10:
        return (
          <StepAdvancedOptions
            accessibilityLevel={formData.accessibilityLevel}
            onAccessibilityLevelChange={setAccessibilityLevel}
            browserCompatibility={formData.browserCompatibility}
            onBrowserCompatChange={setBrowserCompat}
            externalResourcesAccessible={formData.externalResourcesAccessible}
            onExternalResourcesChange={setExternalResources}
            designDirection={formData.designDirection}
            onDesignDirectionChange={setDesignDirection}
          />
        );
      case 11:
        return (
          <StepSkills
            selectedSharedSkillIds={formData.selectedSharedSkillIds}
            onSharedSkillsChange={setSharedSkills}
            customSkills={formData.customSkills}
            onCustomSkillsChange={setCustomSkills}
            sharedSkills={sharedSkills}
          />
        );
      case 12:
        return (
          <StepMemories
            sharedMemories={sharedMemories}
            selectedSharedMemoryIds={formData.selectedSharedMemoryIds ?? []}
            onSharedMemoriesChange={setSharedMemories}
            customMemories={formData.customMemories ?? []}
            onCustomMemoriesChange={setCustomMemories}
          />
        );
      case 13:
        return <StepReview formData={formData} sharedSkills={sharedSkills} sharedMemories={sharedMemories} onCopy={handleCopy} copied={copied} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Header title="New Project" description="Configure your design & development prompt" />
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: 'New Project' },
      ]} />
      <PageContainer wide>
        <div className="mb-6 max-w-md">
          <Input
            label="Project Name"
            type="text"
            value={formData.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Feature Design"
          />
        </div>
        <WizardShell
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
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <WizardContent />
    </Suspense>
  );
}
