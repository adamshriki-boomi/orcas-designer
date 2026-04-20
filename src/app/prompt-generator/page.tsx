'use client';

import { usePrompts } from '@/hooks/use-prompts';
import { PromptList } from '@/components/dashboard/prompt-list';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, isLoading } = usePrompts();

  return (
    <FadeIn>
      <Header
        title="Prompt Generator"
        description="Generate Claude Code briefs with the lo-fi → prototype → hi-fi progression"
        action={
          <Link href="/prompt-generator/new" className={buttonVariants()}>
            <PlusCircle />
            New Prompt
          </Link>
        }
      />
      <PageContainer>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <PromptList projects={projects} />
        )}
      </PageContainer>
    </FadeIn>
  );
}
