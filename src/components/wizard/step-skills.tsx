"use client";

import { useMemo } from "react";
import { MandatorySkillsList } from "@/components/skills/mandatory-skills-list";
import { SharedSkillsPicker } from "@/components/skills/shared-skills-picker";
import { CustomSkillAdder } from "@/components/skills/custom-skill-adder";
import { WizardStep } from "./wizard-step";
import { getActiveSkillsForProject } from "@/lib/skill-filter";
import type { Project, SharedSkill, CustomSkill } from "@/lib/types";

interface StepSkillsProps {
  formData: Project;
  selectedSharedSkillIds: string[];
  onSharedSkillsChange: (ids: string[]) => void;
  customSkills: CustomSkill[];
  onCustomSkillsChange: (skills: CustomSkill[]) => void;
  sharedSkills: SharedSkill[];
}

export function StepSkills({
  formData,
  selectedSharedSkillIds,
  onSharedSkillsChange,
  customSkills,
  onCustomSkillsChange,
  sharedSkills,
}: StepSkillsProps) {
  const activeSkills = useMemo(
    () => getActiveSkillsForProject(formData),
    [formData]
  );

  return (
    <WizardStep
      title="Skills Configuration"
      description="Review mandatory skills and select additional ones"
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Mandatory Skills ({activeSkills.length})</h3>
          <MandatorySkillsList skills={activeSkills} />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Shared Skills</h3>
          <SharedSkillsPicker
            sharedSkills={sharedSkills}
            selectedIds={selectedSharedSkillIds}
            onChange={onSharedSkillsChange}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium">Custom Skills</h3>
          <CustomSkillAdder
            skills={customSkills}
            onChange={onCustomSkillsChange}
          />
        </section>
      </div>
    </WizardStep>
  );
}
