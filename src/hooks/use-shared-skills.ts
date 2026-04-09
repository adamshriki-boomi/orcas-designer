'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { SharedSkill } from '@/lib/types';

function toSharedSkill(row: Record<string, unknown>): SharedSkill {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    type: row.type as 'url' | 'file',
    urlValue: row.url_value as string,
    fileContent: row.file_content as SharedSkill['fileContent'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useSharedSkills() {
  const { user } = useAuth();
  const [sharedSkills, setSharedSkills] = useState<SharedSkill[]>([]);

  const fetchSkills = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shared_skills')
      .select('*')
      .order('name');
    if (!error && data) {
      setSharedSkills(data.map(toSharedSkill));
    }
  }, []);

  useEffect(() => {
    if (user) fetchSkills();
  }, [user, fetchSkills]);

  const addSkill = useCallback(async (
    skill: Omit<SharedSkill, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shared_skills')
      .insert({
        name: skill.name,
        description: skill.description,
        type: skill.type,
        url_value: skill.urlValue,
        file_content: skill.fileContent as never,
        created_by: user?.id,
      })
      .select('id')
      .single();
    if (error) throw error;
    await fetchSkills();
    return data.id;
  }, [user, fetchSkills]);

  const updateSkill = useCallback(async (id: string, updates: Partial<SharedSkill>): Promise<void> => {
    const supabase = createClient();
    const mapped: Record<string, unknown> = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.description !== undefined) mapped.description = updates.description;
    if (updates.type !== undefined) mapped.type = updates.type;
    if (updates.urlValue !== undefined) mapped.url_value = updates.urlValue;
    if (updates.fileContent !== undefined) mapped.file_content = updates.fileContent;

    await supabase.from('shared_skills').update(mapped as never).eq('id', id);
    await fetchSkills();
  }, [fetchSkills]);

  const deleteSkill = useCallback(async (id: string): Promise<void> => {
    const supabase = createClient();
    // Cascade handled by DB trigger (removes ID from projects' arrays)
    await supabase.from('shared_skills').delete().eq('id', id);
    await fetchSkills();
  }, [fetchSkills]);

  const isSkillUsed = useCallback(async (id: string): Promise<string[]> => {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('name')
      .contains('selected_shared_skill_ids', [id]);
    return data?.map(p => p.name) ?? [];
  }, []);

  return { sharedSkills, addSkill, updateSkill, deleteSkill, isSkillUsed };
}
