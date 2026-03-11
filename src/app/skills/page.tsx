'use client';

import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { SharedSkillManager } from '@/components/skills/shared-skill-manager';

export default function SkillsPage() {
  return (
    <FadeIn>
      <Header
        title="Shared Skills"
        description="View built-in and manage custom skills shared across all projects"
      />
      <PageContainer>
        <SharedSkillManager />
      </PageContainer>
    </FadeIn>
  );
}
