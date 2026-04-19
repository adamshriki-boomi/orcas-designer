'use client';

import type { SharedSkill, CustomSkill } from '@/lib/types';
import type { MandatorySkill } from '@/lib/constants';
import type { BuiltInSkill } from '@/lib/built-in-skills';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TagBadge } from '@/components/ui/tag-badge';
import { Lock, Trash2, Edit, Link, FileText } from 'lucide-react';

type AnySkill = MandatorySkill | BuiltInSkill | SharedSkill | CustomSkill;

interface SkillCardProps {
  skill: AnySkill;
  locked?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function isMandatorySkill(skill: AnySkill): skill is MandatorySkill {
  return 'category' in skill && 'invocation' in skill;
}

function isBuiltInContentSkill(skill: AnySkill): skill is BuiltInSkill {
  return 'content' in skill;
}

export function SkillCard({
  skill,
  locked = false,
  selected = false,
  onToggle,
  onView,
  onEdit,
  onDelete,
}: SkillCardProps) {
  const skillType = 'type' in skill ? skill.type : undefined;
  const description = 'description' in skill ? skill.description : undefined;
  const category = isMandatorySkill(skill) || isBuiltInContentSkill(skill) ? skill.category : undefined;
  const tags = isBuiltInContentSkill(skill) ? skill.tags : [];

  return (
    <Card
      size="sm"
      className={cn(
        'transition-all duration-150',
        selected && 'ring-primary',
        onView && 'cursor-pointer hover:shadow-card-hover hover:scale-[1.01]'
      )}
      onClick={onView}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          {locked ? (
            <Lock className="size-4 shrink-0 text-muted-foreground" />
          ) : onToggle ? (
            <Checkbox
              checked={selected}
              onCheckedChange={onToggle}
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
          <CardTitle className="flex items-center gap-2">
            {skill.name}
            {skillType && (
              <span className="inline-flex items-center text-muted-foreground">
                {skillType === 'url' ? (
                  <Link className="size-3.5" />
                ) : (
                  <FileText className="size-3.5" />
                )}
              </span>
            )}
          </CardTitle>
        </div>
        {(onEdit || onDelete) && (
          <CardAction>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Edit />
                  <span className="sr-only">Edit</span>
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                  <Trash2 className="text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>
          </CardAction>
        )}
        {(description || category) && (
          <CardDescription className="flex items-center gap-2">
            {category && (
              <Badge variant={category.toLowerCase().replace(' ', '-') as 'secondary'}>{category}</Badge>
            )}
            {description && <span className="line-clamp-2">{description}</span>}
          </CardDescription>
        )}
        {tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
