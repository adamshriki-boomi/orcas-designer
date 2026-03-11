'use client';

import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { SharedMemoryManager } from '@/components/memories/shared-memory-manager';

export default function MemoriesPage() {
  return (
    <FadeIn>
      <Header
        title="Shared Memories"
        description="Manage context files shared across all projects"
      />
      <PageContainer>
        <SharedMemoryManager />
      </PageContainer>
    </FadeIn>
  );
}
