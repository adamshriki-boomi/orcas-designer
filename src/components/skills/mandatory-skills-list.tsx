'use client';

import { MANDATORY_SKILLS, SKILL_CATEGORIES } from '@/lib/constants';
import type { MandatorySkill } from '@/lib/constants';
import { SkillCard } from './skill-card';

interface MandatorySkillsListProps {
  skills?: MandatorySkill[];
}

export function MandatorySkillsList({ skills }: MandatorySkillsListProps) {
  const list = skills ?? MANDATORY_SKILLS;
  const categories = skills
    ? [...new Set(list.map((s) => s.category))]
    : SKILL_CATEGORIES;

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const catSkills = list.filter((s) => s.category === category);
        if (catSkills.length === 0) return null;
        return (
          <section key={category}>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {category}
            </h3>
            <div className="grid gap-2">
              {catSkills.map((skill) => (
                <SkillCard key={skill.name} skill={skill} locked />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
