'use client';

import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { PromptRenderer } from '@/components/prompt/prompt-renderer';

interface PromptPreviewProps {
  prompt: string;
  onCopy: () => void;
  copied: boolean;
}

export function PromptPreview({ prompt, onCopy, copied }: PromptPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Prompt</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onCopy} disabled={!prompt}>
            {copied ? (
              <Check className="size-3.5 text-green-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <PromptRenderer prompt={prompt} />
      </CardContent>
    </Card>
  );
}
