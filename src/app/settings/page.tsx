'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Trash2, Sun, Moon, LogOut, Save } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { PageContainer } from '@/components/layout/page-container';
import { FadeIn } from '@/components/ui/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useUserSettings } from '@/hooks/use-user-settings';
import { toast } from '@/components/ui/sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { loading, saveApiKey, deleteApiKey, hasApiKey, maskedKey } = useUserSettings();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  async function handleSaveApiKey() {
    setSaving(true);
    try {
      await saveApiKey(apiKey);
      setApiKey('');
      toast.success('API key saved');
    } catch {
      toast.error('Unable to save API key');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteApiKey() {
    setDeleting(true);
    try {
      await deleteApiKey();
      toast.success('API key deleted');
      setDeleteDialogOpen(false);
    } catch {
      toast.error('Unable to delete API key');
    } finally {
      setDeleting(false);
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
            {hasApiKey ? (
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono text-foreground">{maskedKey}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    type="password"
                    placeholder={loading ? 'Loading...' : 'sk-ant-...'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim() || saving}
                  size="sm"
                >
                  <Save className="size-4 mr-1.5" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </section>

          {/* Delete API Key Confirmation */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete API key</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete your Claude API key? The UX Writer will stop working until you add a new key.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDeleteApiKey}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
