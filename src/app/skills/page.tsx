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
        description="Manage skills shared across all prompts"
      />
      <PageContainer>
        <SharedSkillManager />
      </PageContainer>
    </FadeIn>
  );
}
