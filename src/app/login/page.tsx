'use client';

import { useState } from 'react';
import { Waves, Mail, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';

type LoginMode = 'magic-link' | 'password';

export default function LoginPage() {
  const { signInWithEmail, signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>('magic-link');

  function validateEmail(): string | null {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return 'Please enter your email address.';
    if (!trimmed.endsWith('@boomi.com')) return 'Only @boomi.com email addresses are allowed.';
    return null;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const emailError = validateEmail();
    if (emailError) { setError(emailError); return; }

    setLoading(true);
    const { error: authError } = await signInWithEmail(email.trim().toLowerCase());
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const emailError = validateEmail();
    if (emailError) { setError(emailError); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    const { error: authError } = await signInWithPassword(email.trim().toLowerCase(), password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
            <Waves className="size-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Orcas Designer
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Sign in with your Boomi email to continue
          </p>
        </div>

        {sent ? (
          /* Magic link sent state */
          <div className="rounded-lg border border-border bg-card p-6 text-center space-y-3">
            <CheckCircle className="size-10 text-green-500 mx-auto" />
            <h2 className="font-heading text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>.
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-sm text-primary hover:underline cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        ) : mode === 'magic-link' ? (
          /* Magic link form */
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@boomi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send magic link'}
                {!loading && <ArrowRight className="size-4 ml-1" />}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Only @boomi.com email addresses are allowed
            </p>

            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground text-center cursor-pointer"
            >
              Sign in with password instead
            </button>
          </form>
        ) : (
          /* Password form */
          <form onSubmit={handlePassword} className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email-pw">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email-pw"
                    type="email"
                    placeholder="you@boomi.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="size-4 ml-1" />}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => { setMode('magic-link'); setError(''); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground text-center cursor-pointer"
            >
              Use magic link instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
