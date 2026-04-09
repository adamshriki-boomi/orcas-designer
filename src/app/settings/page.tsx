'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Eye, EyeOff, Sun, Moon, LogOut, Save, Check } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useUserSettings } from '@/hooks/use-user-settings';
import { toast } from '@/components/ui/sonner';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { settings, loading, saveApiKey } = useUserSettings();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => setMounted(true), []);

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      setApiKey(settings.claudeApiKey);
    }
  }, [settings]);

  const isDark = mounted && resolvedTheme === 'dark';
  const isDirty = settings ? apiKey !== settings.claudeApiKey : false;

  async function handleSaveApiKey() {
    setSaving(true);
    try {
      await saveApiKey(apiKey);
      setSaved(true);
      toast.success('API key saved');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Unable to save API key');
    } finally {
      setSaving(false);
    }
  }

  return (
    <FadeIn>
      <Header title="Settings" />
      <PageContainer>
        <div className="space-y-6">
          {/* Section 1: Appearance */}
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Appearance</h2>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {mounted ? (isDark ? 'Dark mode is active' : 'Light mode is active') : 'Loading...'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
              >
                {isDark ? <Sun className="size-4 mr-1.5" /> : <Moon className="size-4 mr-1.5" />}
                {mounted ? (isDark ? 'Light mode' : 'Dark mode') : 'Toggle'}
              </Button>
            </div>
          </section>

          {/* Section 2: AI Configuration */}
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-1">AI Configuration</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Your Claude API key is used by the UX Writer to generate copy suggestions.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={loading ? 'Loading...' : 'sk-ant-...'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setSaved(false);
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button
                onClick={handleSaveApiKey}
                disabled={!isDirty || saving}
                size="sm"
              >
                {saved ? (
                  <Check className="size-4 mr-1.5" />
                ) : (
                  <Save className="size-4 mr-1.5" />
                )}
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </section>

          {/* Section 3: Account */}
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Account</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="size-9 rounded-full shrink-0"
                  />
                ) : (
                  <div className="size-9 rounded-full shrink-0 bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                    {(user?.email ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  {user?.user_metadata?.full_name && (
                    <p className="text-sm font-medium truncate">
                      {user.user_metadata.full_name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground truncate">
                    {user?.email ?? 'Not signed in'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="size-4 mr-1.5" />
                Sign out
              </Button>
            </div>
          </section>
        </div>
      </PageContainer>
    </FadeIn>
  );
}
