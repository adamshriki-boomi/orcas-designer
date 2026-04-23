'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

interface UserSettings {
  claudeApiKey: string;
  confluenceBaseUrl: string;
  confluenceEmail: string;
  confluenceApiToken: string;
}

function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length < 14) return '****';
  return key.slice(0, 10) + '...' + key.slice(-4);
}

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_settings')
      .select('claude_api_key, confluence_base_url, confluence_email, confluence_api_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) { console.error('Failed to fetch settings:', error); }
    setSettings(data ? {
      claudeApiKey: data.claude_api_key,
      confluenceBaseUrl: data.confluence_base_url ?? '',
      confluenceEmail: data.confluence_email ?? '',
      confluenceApiToken: data.confluence_api_token ?? '',
    } : {
      claudeApiKey: '',
      confluenceBaseUrl: '',
      confluenceEmail: '',
      confluenceApiToken: '',
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchSettings();
  }, [user, fetchSettings]);

  /** Upsert a partial set of fields into user_settings. */
  const upsertSettings = useCallback(async (fields: Record<string, string>) => {
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
        .update(fields as never)
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...fields });
      if (error) throw error;
    }
  }, [user]);

  const saveApiKey = useCallback(async (apiKey: string) => {
    // Trim to defend against stray whitespace from copy-paste — Anthropic's
    // bearer-token check rejects any non-exact match with a 401.
    const trimmed = apiKey.trim();
    await upsertSettings({ claude_api_key: trimmed });
    setSettings((prev) => prev ? { ...prev, claudeApiKey: trimmed } : prev);
  }, [upsertSettings]);

  const deleteApiKey = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
    setSettings({
      claudeApiKey: '',
      confluenceBaseUrl: '',
      confluenceEmail: '',
      confluenceApiToken: '',
    });
  }, [user]);

  const saveConfluenceSettings = useCallback(async (
    baseUrl: string,
    email: string,
    apiToken: string
  ) => {
    await upsertSettings({
      confluence_base_url: baseUrl,
      confluence_email: email,
      confluence_api_token: apiToken,
    });
    setSettings((prev) => prev ? {
      ...prev,
      confluenceBaseUrl: baseUrl,
      confluenceEmail: email,
      confluenceApiToken: apiToken,
    } : prev);
  }, [upsertSettings]);

  const deleteConfluenceSettings = useCallback(async () => {
    await upsertSettings({
      confluence_base_url: '',
      confluence_email: '',
      confluence_api_token: '',
    });
    setSettings((prev) => prev ? {
      ...prev,
      confluenceBaseUrl: '',
      confluenceEmail: '',
      confluenceApiToken: '',
    } : prev);
  }, [upsertSettings]);

  return {
    settings,
    loading,
    saveApiKey,
    deleteApiKey,
    hasApiKey: Boolean(settings?.claudeApiKey),
    maskedKey: maskApiKey(settings?.claudeApiKey ?? ''),
    saveConfluenceSettings,
    deleteConfluenceSettings,
    hasConfluenceSettings: Boolean(
      settings?.confluenceBaseUrl && settings?.confluenceEmail && settings?.confluenceApiToken
    ),
  };
}
