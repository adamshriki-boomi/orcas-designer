'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { beginFigmaOAuth } from '@/lib/figma-oauth';
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

function SettingsPageInner() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    figmaConnection,
    disconnectFigma,
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

  // Figma OAuth state
  const [disconnectFigmaDialogOpen, setDisconnectFigmaDialogOpen] = useState(false);
  const [disconnectingFigma, setDisconnectingFigma] = useState(false);
  const figmaToastRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Toast on return from the OAuth callback (?figma=connected | ?figma=error&reason=...)
  useEffect(() => {
    if (figmaToastRef.current) return;
    const status = searchParams.get('figma');
    if (!status) return;
    figmaToastRef.current = true;

    if (status === 'connected') {
      toast.success('Connected to Figma');
    } else if (status === 'error') {
      const reason = searchParams.get('reason');
      toast.error(reason ? `Figma connection failed: ${reason}` : 'Figma connection failed');
    }
    // Strip the query so a refresh doesn't re-toast.
    router.replace('/settings');
  }, [searchParams, router]);

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

  function handleConnectFigma() {
    try {
      beginFigmaOAuth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to start Figma OAuth');
    }
  }

  async function handleDisconnectFigma() {
    setDisconnectingFigma(true);
    try {
      await disconnectFigma();
      toast.success('Disconnected from Figma');
      setDisconnectFigmaDialogOpen(false);
    } catch {
      toast.error('Unable to disconnect from Figma');
    } finally {
      setDisconnectingFigma(false);
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
              Connect your Figma account so Visual QA can render frames from private files.
              You&apos;ll be redirected to Figma to approve read-only access; nothing is written back.
            </p>
            {figmaConnection ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Connected as <span className="text-foreground">{figmaConnection.email}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisconnectFigmaDialogOpen(true)}
                  className="text-destructive hover:text-destructive cursor-pointer"
                >
                  <Trash2 className="size-4 mr-1.5" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <Button
                  onClick={handleConnectFigma}
                  disabled={loading}
                  size="sm"
                  className="cursor-pointer"
                >
                  Connect to Figma
                </Button>
              </div>
            )}
          </section>

          {/* Disconnect Figma Confirmation */}
          <AlertDialog open={disconnectFigmaDialogOpen} onOpenChange={setDisconnectFigmaDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect from Figma</AlertDialogTitle>
                <AlertDialogDescription>
                  Visual QA won&apos;t be able to render Figma frames until you reconnect.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDisconnectFigma}
                  disabled={disconnectingFigma}
                >
                  {disconnectingFigma ? 'Disconnecting...' : 'Disconnect'}
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

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
