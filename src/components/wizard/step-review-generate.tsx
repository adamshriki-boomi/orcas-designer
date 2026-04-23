'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, Save, KeyRound, Lock } from 'lucide-react';
import { WizardStep } from './wizard-step';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const { loading: settingsLoading, hasApiKey, saveApiKey } = useUserSettings();
  const { generate, isStarting } = useGenerateVersion();
  const [error, setError] = useState<string | null>(null);
  const [inlineApiKey, setInlineApiKey] = useState('');
  const [savingInlineKey, setSavingInlineKey] = useState(false);

  async function handleSaveInlineKey() {
    if (!inlineApiKey.trim()) return;
    setSavingInlineKey(true);
    try {
      await saveApiKey(inlineApiKey);
      setInlineApiKey('');
      toast.success('API key saved');
    } catch {
      toast.error('Unable to save API key');
    } finally {
      setSavingInlineKey(false);
    }
  }

  const mandatorySkills = getActiveSkillsForPrompt(formData);
  const selectedSharedSkills = formData.selectedSharedSkillIds
    .map((id) => sharedSkills.find((s) => s.id === id))
    .filter((s): s is SharedSkill => s !== undefined);
  const selectedSharedMemories = (formData.selectedSharedMemoryIds ?? [])
    .map((id) => sharedMemories.find((m) => m.id === id))
    .filter((m): m is SharedMemory => m !== undefined);

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
      // promptToRow packs the form data into row.data via its own formFields
      // constant — don't duplicate that list here.
      const row = promptToRow(projectData, user.id);
      row.id = id;
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
      description="Everything Claude Opus 4.7 will see before it writes the brief. The brief will generate only the design products you selected."
    >
      <div className="space-y-6">
        {/* Summary */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Summary</h3>
          <Card>
            <CardContent className="space-y-3">
              <Row label="Prompt name" value={formData.name || 'Untitled'} />
              <Row
                label="Feature"
                value={formData.featureDefinition.name || '—'}
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
                  value={<code className="text-xs break-all">{formData.designProducts.figmaDestinationUrl}</code>}
                />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Skills */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            Skills ({mandatorySkills.length + selectedSharedSkills.length + formData.customSkills.length})
          </h3>
          <Card>
            <CardContent className="space-y-4">
              {mandatorySkills.length > 0 && (
                <ItemGroup
                  heading="Always included"
                  headingIcon={<Lock className="size-3.5 text-muted-foreground" />}
                >
                  {mandatorySkills.map((s) => (
                    <ItemRow key={s.name} title={s.name} subtitle={s.description} />
                  ))}
                </ItemGroup>
              )}
              {selectedSharedSkills.length > 0 && (
                <ItemGroup heading="Shared">
                  {selectedSharedSkills.map((s) => (
                    <ItemRow key={s.id} title={s.name} subtitle={s.description} />
                  ))}
                </ItemGroup>
              )}
              {formData.customSkills.length > 0 && (
                <ItemGroup heading="Custom">
                  {formData.customSkills.map((s) => (
                    <ItemRow
                      key={s.id}
                      title={s.name}
                      subtitle={s.urlValue || (s.fileContent?.name ?? '')}
                    />
                  ))}
                </ItemGroup>
              )}
              {mandatorySkills.length === 0 &&
                selectedSharedSkills.length === 0 &&
                formData.customSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills attached.</p>
                )}
            </CardContent>
          </Card>
        </section>

        {/* Memories */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            Memories ({selectedSharedMemories.length + (formData.customMemories?.length ?? 0)})
          </h3>
          <Card>
            <CardContent className="space-y-4">
              {selectedSharedMemories.length > 0 && (
                <ItemGroup heading="Shared">
                  {selectedSharedMemories.map((m) => (
                    <ItemRow
                      key={m.id}
                      title={m.name}
                      subtitle={m.description}
                      badge={m.isBuiltIn ? 'Built-in' : undefined}
                    />
                  ))}
                </ItemGroup>
              )}
              {(formData.customMemories ?? []).length > 0 && (
                <ItemGroup heading="Custom">
                  {(formData.customMemories ?? []).map((m) => (
                    <ItemRow
                      key={m.id}
                      title={m.name}
                      subtitle={m.content.slice(0, 120) + (m.content.length > 120 ? '...' : '')}
                    />
                  ))}
                </ItemGroup>
              )}
              {selectedSharedMemories.length === 0 && (formData.customMemories?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No memories attached.</p>
              )}
            </CardContent>
          </Card>
        </section>

        {!settingsLoading && !hasApiKey && (
          <div className="rounded-xl border border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/20 p-4">
            <div className="flex items-start gap-3">
              <KeyRound className="size-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Claude API key required</h3>
                  <p className="text-xs text-muted-foreground">
                    The Prompt Generator calls Claude Opus 4.7 with your own API key. Paste it here to save and keep going — no need to leave the wizard.
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="password"
                      placeholder="sk-ant-..."
                      value={inlineApiKey}
                      onChange={(e) => setInlineApiKey(e.target.value)}
                      disabled={savingInlineKey}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveInlineKey}
                    disabled={!inlineApiKey.trim() || savingInlineKey}
                    className="cursor-pointer"
                  >
                    {savingInlineKey ? 'Saving...' : 'Save key'}
                  </Button>
                </div>
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

function ItemGroup({
  heading,
  headingIcon,
  children,
}: {
  heading: string;
  headingIcon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {headingIcon}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ItemRow({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border/50 p-2.5">
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{title}</p>
          {badge && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
