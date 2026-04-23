'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

interface PromptRendererProps {
  prompt: string;
}

export function PromptRenderer({ prompt }: PromptRendererProps) {
  if (!prompt) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No prompt generated yet. Fill in project details to generate a prompt.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[37.5rem] w-full rounded-md border">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words text-foreground">
        {prompt}
      </pre>
    </ScrollArea>
  );
}
