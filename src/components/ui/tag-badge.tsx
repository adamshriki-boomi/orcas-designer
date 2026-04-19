'use client';

import { Badge } from '@/components/ui/badge';

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  const isBoomiKnowledge = tag === 'Boomi Knowledge';
  return (
    <Badge variant={isBoomiKnowledge ? 'secondary' : 'outline'} className="text-[10px] font-medium">
      {tag}
    </Badge>
  );
}
