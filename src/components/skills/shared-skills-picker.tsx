'use client';

import type { BuiltInSkill } from '@/lib/built-in-skills';
import type { SharedSkill } from '@/lib/types';
import { SkillCard } from './skill-card';

interface SharedSkillsPickerProps {
  sharedSkills: SharedSkill[];
  builtInSkills?: BuiltInSkill[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  lockedIds?: string[];
}

export function SharedSkillsPicker({
  sharedSkills,
  builtInSkills = [],
  selectedIds,
  onChange,
  lockedIds = [],
}: SharedSkillsPickerProps) {
  function handleToggle(skillId: string) {
    if (lockedIds.includes(skillId)) return;
    if (selectedIds.includes(skillId)) {
      onChange(selectedIds.filter((id) => id !== skillId));
    } else {
      onChange([...selectedIds, skillId]);
    }
  }

  const hasAny = sharedSkills.length > 0 || builtInSkills.length > 0;

  if (!hasAny) {
    return (
      <p className="text-sm text-muted-foreground">
        No shared skills available. Create shared skills on the Skills page to use them here.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {builtInSkills.map((skill) => {
        const isSelected = selectedIds.includes(skill.id) || lockedIds.includes(skill.id);
        const isLocked = lockedIds.includes(skill.id);
        return (
          <SkillCard
            key={skill.id}
            skill={skill}
            selected={isSelected}
            locked={isLocked}
            onToggle={isLocked ? undefined : () => handleToggle(skill.id)}
          />
        );
      })}
      {sharedSkills.map((skill) => {
        const isSelected = selectedIds.includes(skill.id) || lockedIds.includes(skill.id);
        const isLocked = lockedIds.includes(skill.id);
        return (
          <SkillCard
            key={skill.id}
            skill={skill}
            selected={isSelected}
            locked={isLocked}
            onToggle={isLocked ? undefined : () => handleToggle(skill.id)}
          />
        );
      })}
    </div>
  );
}
