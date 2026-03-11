'use client';

import type { SharedSkill } from '@/lib/types';
import { SkillCard } from './skill-card';

interface SharedSkillsPickerProps {
  sharedSkills: SharedSkill[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function SharedSkillsPicker({
  sharedSkills,
  selectedIds,
  onChange,
}: SharedSkillsPickerProps) {
  function handleToggle(skillId: string) {
    if (selectedIds.includes(skillId)) {
      onChange(selectedIds.filter((id) => id !== skillId));
    } else {
      onChange([...selectedIds, skillId]);
    }
  }

  if (sharedSkills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No shared skills available. Create shared skills on the Skills page to use them here.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {sharedSkills.map((skill) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          selected={selectedIds.includes(skill.id)}
          onToggle={() => handleToggle(skill.id)}
        />
      ))}
    </div>
  );
}
