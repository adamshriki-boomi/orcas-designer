'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

interface UserSettings {
  claudeApiKey: string;
}

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setSettings(data ? { claudeApiKey: data.claude_api_key } : { claudeApiKey: '' });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user, fetchSettings]);

  const saveApiKey = useCallback(async (apiKey: string) => {
    if (!user) return;
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_settings')
        .update({ claude_api_key: apiKey } as never)
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, claude_api_key: apiKey });
      if (error) throw error;
    }

    setSettings({ claudeApiKey: apiKey });
  }, [user]);

  return { settings, loading, saveApiKey, hasApiKey: Boolean(settings?.claudeApiKey) };
}
