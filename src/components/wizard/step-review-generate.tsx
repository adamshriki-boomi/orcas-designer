'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, Save, KeyRound } from 'lucide-react';
import { WizardStep } from './wizard-step';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buildPromptGenerationPayload } from '@/lib/prompt-payload-builder';
import { getActiveSkillsForPrompt } from '@/lib/skill-filter';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useUserSettings } from '@/hooks/use-user-settings';
import { promptToRow } from '@/hooks/use-prompts';
import { useGenerateVersion } from '@/hooks/use-prompt-versions';
import { generateId } from '@/lib/id';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import type { Prompt, SharedSkill, SharedMemory, DesignProduct } from '@/lib/types';

interface StepReviewGenerateProps {
  formData: Prompt;
  sharedSkills: SharedSkill[];
  sharedMemories: SharedMemory[];
  onSave: () => Promise<void>;
}

const PRODUCT_LABELS: Record<DesignProduct, string> = {
  wireframe: 'Wireframe',
  mockup: 'Mockup',
  'animated-prototype': 'Animated prototype',
};

export function StepReviewGenerate({
  formData,
  sharedSkills,
  sharedMemories,
  onSave,
}: StepReviewGenerateProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { loading: settingsLoading, hasApiKey } = useUserSettings();
  const { generate, isStarting } = useGenerateVersion();
  const [error, setError] = useState<string | null>(null);

  const mandatorySkills = getActiveSkillsForPrompt(formData);
  const totalSkills =
    mandatorySkills.length +
    formData.selectedSharedSkillIds.length +
    formData.customSkills.length;
  const totalMemories =
    (formData.selectedSharedMemoryIds ?? []).length +
    (formData.customMemories ?? []).length;

  async function handleGenerate() {
    if (!user) {
      setError('You must be logged in.');
      return;
    }
    if (!hasApiKey) {
      setError(
        'Add your Claude API key in Settings before generating. The Prompt Generator calls Opus 4.7 on your behalf.',
      );
      return;
    }

    setError(null);

    try {
      // Save a fresh row for this new prompt.
      const id = generateId();
      const projectData = {
        ...formData,
        id,
        name: formData.name || 'Untitled Prompt',
      };
      const row = promptToRow(projectData, user.id);
      row.id = id;
      row.data = {
        companyInfo: projectData.companyInfo,
        productInfo: projectData.productInfo,
        featureDefinition: projectData.featureDefinition,
        featureInfo: projectData.featureInfo,
        currentImplementation: projectData.currentImplementation,
        uxResearch: projectData.uxResearch,
        uxWriting: projectData.uxWriting,
        figmaFileLink: projectData.figmaFileLink,
        designSystemStorybook: projectData.designSystemStorybook,
        designSystemNpm: projectData.designSystemNpm,
        designSystemFigma: projectData.designSystemFigma,
        prototypeSketches: projectData.prototypeSketches,
        designProducts: projectData.designProducts,
      };
      const supabase = createClient();
      const { error: insertError } = await supabase.from('prompts').insert(row as never);
      if (insertError) throw insertError;

      // Kick off the AI generation.
      const { wizardSnapshot, contextSnapshot } = buildPromptGenerationPayload(
        projectData,
        sharedSkills,
        sharedMemories,
      );
      await generate(id, wizardSnapshot, contextSnapshot);

      toast.success('Prompt saved. Generating with Claude Opus 4.7...');
      // SPA redirect pattern: navigate via placeholder so the 404.html
      // redirect picks up the dynamic id.
      router.push(`/prompt-generator/placeholder?_id=${encodeURIComponent(id)}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Generation failed';
      setError(message);
      toast.error(message);
    }
  }

  return (
    <WizardStep
      title="Review & Generate"
      description="Click Generate to have Claude Opus 4.7 author a custom Claude Code brief. Lo-fi → animated prototype → hi-fi in one session."
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-3">
            <Row label="Prompt name" value={formData.name || 'Untitled'} />
            <Row
              label="Feature"
              value={
                formData.featureDefinition.name ||
                formData.featureInfo.textValue ||
                formData.featureInfo.urlValue ||
                '—'
              }
            />
            <Row
              label="Type"
              value={
                <Badge variant="secondary">
                  {formData.featureDefinition.mode === 'new' ? 'New feature' : 'Improvement'}
                </Badge>
              }
            />
            <Row
              label="Outputs"
              value={
                formData.designProducts.products.length > 0
                  ? formData.designProducts.products.map((p) => PRODUCT_LABELS[p]).join(', ')
                  : '—'
              }
            />
            {formData.designProducts.figmaDestinationUrl && (
              <Row
                label="Figma destination"
                value={<code className="text-xs">{formData.designProducts.figmaDestinationUrl}</code>}
              />
            )}
            <Row label="Total skills" value={String(totalSkills)} />
            <Row label="Total memories" value={String(totalMemories)} />
          </CardContent>
        </Card>

        {!settingsLoading && !hasApiKey && (
          <div className="rounded-xl border border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/20 p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="size-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold">Claude API key required</h3>
                <p className="text-xs text-muted-foreground">
                  The Prompt Generator calls Claude Opus 4.7 with your own API key. Add your key in Settings to generate.
                </p>
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/settings`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer')}
                >
                  Open Settings
                </a>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!hasApiKey || isStarting}
            className="cursor-pointer"
          >
            <Sparkles className="size-4" />
            {isStarting ? 'Starting...' : 'Generate with Claude Opus 4.7'}
          </Button>
          <Button
            variant="outline"
            onClick={onSave}
            disabled={isStarting}
            className="cursor-pointer"
          >
            <Save className="size-4" />
            Save draft
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Generation takes 30–90 seconds. The prompt is cached on Anthropic&apos;s side, so
          regenerating the same project is cheaper.
        </p>
      </div>
    </WizardStep>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
