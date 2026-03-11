'use client';

import { MANDATORY_SKILLS, SKILL_CATEGORIES } from '@/lib/constants';
import { SkillCard } from './skill-card';

export function MandatorySkillsList() {
  return (
    <div className="space-y-6">
      {SKILL_CATEGORIES.map((category) => {
        const skills = MANDATORY_SKILLS.filter((s) => s.category === category);
        return (
          <section key={category}>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {category}
            </h3>
            <div className="grid gap-2">
              {skills.map((skill) => (
                <SkillCard key={skill.name} skill={skill} locked />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
