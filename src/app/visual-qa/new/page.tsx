'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useSharedMemories, EXOSPHERE_VISUAL_QA_MEMORY_ID } from '@/hooks/use-shared-memories';
import { useVisualQaReports } from '@/hooks/use-visual-qa-reports';
import { useVisualQaAnalyze } from '@/hooks/use-visual-qa-analyze';
import { createClient } from '@/lib/supabase';
import {
  BUILT_IN_COMPANY_CONTEXT_MEMORY_ID,
  BUILT_IN_PRODUCT_MEMORY_ID,
} from '@/lib/constants';
import { parseFigmaNodeUrl } from '@/lib/figma-url';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { MemoryCard } from '@/components/memories/memory-card';
import {
  AlertTriangle, Loader2, Settings, Upload, X, Image as ImageIcon, ScanEye,
} from 'lucide-react';

const ALWAYS_ON = [
  EXOSPHERE_VISUAL_QA_MEMORY_ID,
  BUILT_IN_COMPANY_CONTEXT_MEMORY_ID,
  BUILT_IN_PRODUCT_MEMORY_ID,
];

type DesignSource = 'upload' | 'figma';

export default function NewVisualQaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasApiKey, figmaConnection, loading: settingsLoading } = useUserSettings();
  const hasFigmaConnection = Boolean(figmaConnection);
  const { sharedMemories } = useSharedMemories();
  const { createReport } = useVisualQaReports();
  const { analyze, analyzing } = useVisualQaAnalyze();

  const [title, setTitle] = useState('');
  const [designSource, setDesignSource] = useState<DesignSource>('upload');

  // Upload-source state
  const [designPath, setDesignPath] = useState<string | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [designUploading, setDesignUploading] = useState(false);

  const [implPath, setImplPath] = useState<string | null>(null);
  const [implPreview, setImplPreview] = useState<string | null>(null);
  const [implUploading, setImplUploading] = useState(false);

  // Figma-source state
  const [figmaUrl, setFigmaUrl] = useState('');

  // Memory picker — additional only (always-on are not shown)
  const [extraMemoryIds, setExtraMemoryIds] = useState<string[]>([]);

  const additionalMemories = useMemo(() => {
    return sharedMemories.filter((m) => !ALWAYS_ON.includes(m.id));
  }, [sharedMemories]);

  useEffect(() => {
    return () => {
      if (designPreview) URL.revokeObjectURL(designPreview);
      if (implPreview) URL.revokeObjectURL(implPreview);
    };
  }, [designPreview, implPreview]);

  const uploadFile = useCallback(
    async (file: File, kind: 'design' | 'impl') => {
      if (!user) return;
      const supabase = createClient();
      const path = `${user.id}/${Date.now()}-${kind}-${file.name}`;
      const setter = kind === 'design' ? setDesignUploading : setImplUploading;
      setter(true);
      try {
        const objectUrl = URL.createObjectURL(file);
        if (kind === 'design') {
          if (designPreview) URL.revokeObjectURL(designPreview);
          setDesignPreview(objectUrl);
        } else {
          if (implPreview) URL.revokeObjectURL(implPreview);
          setImplPreview(objectUrl);
        }
        const { error } = await supabase.storage
          .from('visual-qa-uploads')
          .upload(path, file);
        if (error) {
          toast.error(`Unable to upload ${kind} screenshot`);
          return;
        }
        if (kind === 'design') setDesignPath(path);
        else setImplPath(path);
      } finally {
        setter(false);
      }
    },
    [user, designPreview, implPreview]
  );

  const figmaParsed = parseFigmaNodeUrl(figmaUrl.trim());
  const figmaUrlValid = designSource !== 'figma' || (figmaParsed !== null && hasFigmaConnection);
  const designReady = designSource === 'upload' ? !!designPath : !!figmaParsed;

  const canSubmit =
    title.trim().length > 0 &&
    designReady &&
    !!implPath &&
    !designUploading &&
    !implUploading &&
    !analyzing &&
    hasApiKey &&
    figmaUrlValid;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      try {
        // Resolve URLs to pass to the edge function. For upload sources we
        // use a signed URL so the edge function can fetch the private file.
        const supabase = createClient();
        let designImageUrl = '';
        if (designSource === 'upload' && designPath) {
          const { data } = await supabase.storage
            .from('visual-qa-uploads')
            .createSignedUrl(designPath, 60 * 60 * 24); // 24h
          designImageUrl = data?.signedUrl ?? '';
        }
        let implImageUrl = '';
        if (implPath) {
          const { data } = await supabase.storage
            .from('visual-qa-uploads')
            .createSignedUrl(implPath, 60 * 60 * 24);
          implImageUrl = data?.signedUrl ?? '';
        }

        const reportId = await createReport({
          title: title.trim(),
          designSource,
          designImageUrl, // empty for figma; edge function fills it
          designFigmaUrl: designSource === 'figma' ? figmaUrl.trim() : null,
          implImageUrl,
          memoryIds: extraMemoryIds,
          projectId: null,
        });

        // Kick off analysis. Errors are surfaced by useVisualQaAnalyze.
        try {
          await analyze({ reportId, memoryIds: extraMemoryIds });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Analysis failed');
        }

        router.push(`/visual-qa/${reportId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to start Visual QA');
      }
    },
    [
      canSubmit, designSource, designPath, implPath, figmaUrl, title, extraMemoryIds,
      createReport, analyze, router,
    ]
  );

  return (
    <FadeIn>
      <Header title="New Visual QA" />
      <Breadcrumbs items={[{ label: 'Visual QA', href: '/visual-qa' }, { label: 'New' }]} />

      {!settingsLoading && !hasApiKey && (
        <div className="mx-auto mb-4 max-w-2xl px-6">
          <ApiKeyWarning onClick={() => router.push('/settings')} />
        </div>
      )}

      <PageContainer>
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanEye className="size-4 text-muted-foreground" />
                Report
              </CardTitle>
              <CardDescription>
                Give this report a clear title — it shows up in the list and the Confluence page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                label="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Onboarding step 2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Design</CardTitle>
              <CardDescription>
                Upload a Figma export or paste a Figma node URL we&apos;ll render via the Figma API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  aria-pressed={designSource === 'upload'}
                  onClick={() => setDesignSource('upload')}
                  className={`cursor-pointer rounded px-2 py-1 ${designSource === 'upload' ? 'bg-primary text-primary-foreground' : 'border border-border'}`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  aria-pressed={designSource === 'figma'}
                  onClick={() => setDesignSource('figma')}
                  className={`cursor-pointer rounded px-2 py-1 ${designSource === 'figma' ? 'bg-primary text-primary-foreground' : 'border border-border'}`}
                >
                  Figma URL
                </button>
              </div>

              {designSource === 'upload' ? (
                <ImageDropzone
                  preview={designPreview}
                  uploading={designUploading}
                  onFile={(f) => uploadFile(f, 'design')}
                  onClear={() => {
                    if (designPreview) URL.revokeObjectURL(designPreview);
                    setDesignPath(null);
                    setDesignPreview(null);
                  }}
                  label="Drop the design here or click to upload"
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    label="Figma node URL"
                    placeholder="https://www.figma.com/design/.../?node-id=12-345"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                  />
                  {!hasFigmaConnection && (
                    <p className="text-xs text-yellow-700">
                      Connect your Figma account in{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/settings')}
                        className="cursor-pointer underline"
                      >
                        Settings
                      </button>{' '}
                      before using a Figma URL.
                    </p>
                  )}
                  {figmaUrl.trim() && !figmaParsed && (
                    <p className="text-xs text-red-700">
                      That doesn&apos;t look like a Figma node URL — make sure it includes a{' '}
                      <code>node-id</code>.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="size-4 text-muted-foreground" />
                Implementation
              </CardTitle>
              <CardDescription>
                A screenshot of the running product. PNG, JPEG, or WebP, up to 10 MB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageDropzone
                preview={implPreview}
                uploading={implUploading}
                onFile={(f) => uploadFile(f, 'impl')}
                onClear={() => {
                  if (implPreview) URL.revokeObjectURL(implPreview);
                  setImplPath(null);
                  setImplPreview(null);
                }}
                label="Drop the implementation screenshot here or click to upload"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional context (optional)</CardTitle>
              <CardDescription>
                Always attached: <strong>Exosphere Visual QA</strong>, <strong>Boomi Context</strong>,
                and <strong>Rivery Context</strong>. Pick more memories to tailor the analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {additionalMemories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No additional memories available.</p>
              ) : (
                <div className="grid gap-2">
                  {additionalMemories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      selected={extraMemoryIds.includes(memory.id)}
                      onToggle={() =>
                        setExtraMemoryIds((prev) =>
                          prev.includes(memory.id)
                            ? prev.filter((x) => x !== memory.id)
                            : [...prev, memory.id]
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/visual-qa')}
              disabled={analyzing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {analyzing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Running Visual QA…
                </>
              ) : (
                'Run Visual QA'
              )}
            </Button>
          </div>
        </form>
      </PageContainer>
    </FadeIn>
  );
}

function ApiKeyWarning({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
      <AlertTriangle className="size-5 shrink-0 text-yellow-500" />
      <div className="flex-1">
        <p className="text-sm font-medium">Claude API key required</p>
        <p className="text-xs text-muted-foreground">
          Add your API key in Settings to run Visual QA.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onClick}>
        <Settings className="size-4 mr-1.5" />
        Settings
      </Button>
    </div>
  );
}

interface ImageDropzoneProps {
  preview: string | null;
  uploading: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
  label: string;
}

function ImageDropzone({ preview, uploading, onFile, onClear, label }: ImageDropzoneProps) {
  if (preview) {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="block max-h-72 w-full object-contain" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{uploading ? 'Uploading…' : 'Uploaded'}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={uploading}>
            <X className="size-3.5" />
            Remove
          </Button>
        </div>
      </div>
    );
  }
  return (
    <label
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-10 text-center transition-colors hover:border-primary/50"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) onFile(file);
      }}
    >
      <Upload className="size-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{uploading ? 'Uploading…' : label}</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
        className="hidden"
        disabled={uploading}
      />
    </label>
  );
}
