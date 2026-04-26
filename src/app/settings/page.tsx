'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Trash2, Sun, Moon, LogOut, Save, Eye, EyeOff } from 'lucide-react';
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
  const {
    loading,
    settings,
    saveApiKey,
    deleteApiKey,
    hasApiKey,
    maskedKey,
    saveConfluenceSettings,
    deleteConfluenceSettings,
    hasConfluenceSettings,
    saveFigmaToken,
    deleteFigmaToken,
    hasFigmaToken,
  } = useUserSettings();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Confluence form state
  const [confluenceBaseUrl, setConfluenceBaseUrl] = useState('');
  const [confluenceEmail, setConfluenceEmail] = useState('');
  const [confluenceApiToken, setConfluenceApiToken] = useState('');
  const [showConfluenceToken, setShowConfluenceToken] = useState(false);
  const [savingConfluence, setSavingConfluence] = useState(false);
  const [deleteConfluenceDialogOpen, setDeleteConfluenceDialogOpen] = useState(false);
  const [deletingConfluence, setDeletingConfluence] = useState(false);

  // Figma form state
  const [figmaTokenDraft, setFigmaTokenDraft] = useState('');
  const [showFigmaToken, setShowFigmaToken] = useState(false);
  const [savingFigma, setSavingFigma] = useState(false);
  const [deleteFigmaDialogOpen, setDeleteFigmaDialogOpen] = useState(false);
  const [deletingFigma, setDeletingFigma] = useState(false);

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

  async function handleSaveConfluence() {
    setSavingConfluence(true);
    try {
      await saveConfluenceSettings(
        confluenceBaseUrl.trim(),
        confluenceEmail.trim(),
        confluenceApiToken.trim()
      );
      setConfluenceBaseUrl('');
      setConfluenceEmail('');
      setConfluenceApiToken('');
      toast.success('Confluence settings saved');
    } catch {
      toast.error('Unable to save Confluence settings');
    } finally {
      setSavingConfluence(false);
    }
  }

  async function handleDeleteConfluence() {
    setDeletingConfluence(true);
    try {
      await deleteConfluenceSettings();
      toast.success('Confluence settings removed');
      setDeleteConfluenceDialogOpen(false);
    } catch {
      toast.error('Unable to remove Confluence settings');
    } finally {
      setDeletingConfluence(false);
    }
  }

  async function handleSaveFigma() {
    setSavingFigma(true);
    try {
      await saveFigmaToken(figmaTokenDraft);
      setFigmaTokenDraft('');
      toast.success('Figma token saved');
    } catch {
      toast.error('Unable to save Figma token');
    } finally {
      setSavingFigma(false);
    }
  }

  async function handleDeleteFigma() {
    setDeletingFigma(true);
    try {
      await deleteFigmaToken();
      toast.success('Figma token removed');
      setDeleteFigmaDialogOpen(false);
    } catch {
      toast.error('Unable to remove Figma token');
    } finally {
      setDeletingFigma(false);
    }
  }

  const confluenceFormValid =
    confluenceBaseUrl.trim() !== '' &&
    confluenceEmail.trim() !== '' &&
    confluenceApiToken.trim() !== '';

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
              Your Claude API key powers every AI feature in the app — including the UX Writer and Researcher. One key, used everywhere.
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

          {/* Section 3: Confluence Integration */}
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-1">Confluence Integration</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Connect your Atlassian Confluence account to publish research results directly to a Confluence space.
            </p>
            {hasConfluenceSettings ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">{settings?.confluenceBaseUrl}</p>
                    <p className="text-sm text-muted-foreground">{settings?.confluenceEmail}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfluenceDialogOpen(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Base URL</label>
                  <Input
                    type="text"
                    placeholder={loading ? 'Loading...' : 'https://yourcompany.atlassian.net'}
                    value={confluenceBaseUrl}
                    onChange={(e) => setConfluenceBaseUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder={loading ? 'Loading...' : 'your-email@company.com'}
                    value={confluenceEmail}
                    onChange={(e) => setConfluenceEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">API Token</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type={showConfluenceToken ? 'text' : 'password'}
                        placeholder={loading ? 'Loading...' : 'Your Confluence API token'}
                        value={confluenceApiToken}
                        onChange={(e) => setConfluenceApiToken(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfluenceToken(!showConfluenceToken)}
                      className="shrink-0"
                    >
                      {showConfluenceToken ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveConfluence}
                    disabled={!confluenceFormValid || savingConfluence}
                    size="sm"
                  >
                    <Save className="size-4 mr-1.5" />
                    {savingConfluence ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Delete Confluence Settings Confirmation */}
          <AlertDialog open={deleteConfluenceDialogOpen} onOpenChange={setDeleteConfluenceDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Confluence settings</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove your Confluence credentials? You will not be able to publish research results to Confluence until you re-add them.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDeleteConfluence}
                  disabled={deletingConfluence}
                >
                  {deletingConfluence ? 'Removing...' : 'Remove'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Section 3.5: Figma Integration (Visual QA) */}
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-1">Figma Integration</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Personal access token used by Visual QA to render a Figma node as an image.
              Generate one at{' '}
              <a
                href="https://www.figma.com/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="underline cursor-pointer"
              >
                figma.com/settings
              </a>
              {' '}→ Personal access tokens (read-only file_content scope is sufficient).
            </p>
            {hasFigmaToken ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Figma token configured</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteFigmaDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Figma personal access token
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type={showFigmaToken ? 'text' : 'password'}
                        placeholder={loading ? 'Loading...' : 'figd_xxxxxxxxxxxxxxxx'}
                        value={figmaTokenDraft}
                        onChange={(e) => setFigmaTokenDraft(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFigmaToken(!showFigmaToken)}
                      className="shrink-0"
                    >
                      {showFigmaToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveFigma}
                    disabled={!figmaTokenDraft.trim() || savingFigma}
                    size="sm"
                  >
                    <Save className="size-4 mr-1.5" />
                    {savingFigma ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Delete Figma Token Confirmation */}
          <AlertDialog open={deleteFigmaDialogOpen} onOpenChange={setDeleteFigmaDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Figma token</AlertDialogTitle>
                <AlertDialogDescription>
                  Visual QA won&apos;t be able to render Figma nodes until you re-add a token.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDeleteFigma}
                  disabled={deletingFigma}
                >
                  {deletingFigma ? 'Removing...' : 'Remove'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Section 4: Account */}
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
