'use client';

import { useUxAnalyses } from '@/hooks/use-ux-analyses';
import { useUserSettings } from '@/hooks/use-user-settings';
import { AnalysisList } from '@/components/ux-writer/analysis-list';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { buttonVariants, Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, AlertTriangle, Settings } from 'lucide-react';

export default function UxWriterPage() {
  const router = useRouter();
  const { analyses, isLoading } = useUxAnalyses();
  const { hasApiKey, loading: settingsLoading } = useUserSettings();

  return (
    <FadeIn>
      <Header
        title="UX Writer"
        description="Analyze and improve UI copy using Boomi's UX Writing Guidelines"
        action={
          <Link href="/ux-writer/new" className={buttonVariants()}>
            <PlusCircle />
            New Analysis
          </Link>
        }
      />
      {!settingsLoading && !hasApiKey && (
        <div className="mx-6 mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="size-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Claude API key required</p>
            <p className="text-xs text-muted-foreground">Add your API key in Settings to start analyzing UI copy.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
            <Settings className="size-4 mr-1.5" />
            Settings
          </Button>
        </div>
      )}
      <PageContainer>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <AnalysisList analyses={analyses} />
        )}
      </PageContainer>
    </FadeIn>
  );
}
