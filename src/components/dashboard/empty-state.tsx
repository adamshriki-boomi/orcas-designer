'use client';

import { PlusCircle, Palette } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/motion';
import Link from 'next/link';

export function EmptyState() {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-xl" />
        <div className="relative rounded-full gradient-primary p-5">
          <Palette className="size-8 text-white" />
        </div>
      </div>
      <h3 className="font-heading text-xl font-bold mb-2">No projects yet</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Create your first project to start generating design & development prompts for Claude Code.
      </p>
      <Link
        href="/projects/new"
        className={buttonVariants({ size: 'lg' })}
      >
        <PlusCircle />
        Create New Project
      </Link>
    </FadeIn>
  );
}
