'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SectionLoader } from '@/components/ui/loader';
import {
  consumeFigmaState,
  exchangeFigmaCode,
  getFigmaRedirectUri,
} from '@/lib/figma-oauth';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const ranRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const figmaError = params.get('error');
    const code = params.get('code');
    const state = params.get('state');
    const expectedState = consumeFigmaState();

    if (figmaError) {
      router.replace(`/settings?figma=error&reason=${encodeURIComponent(figmaError)}`);
      return;
    }
    if (!code || !state) {
      router.replace('/settings?figma=error&reason=missing_code');
      return;
    }
    if (!expectedState || state !== expectedState) {
      router.replace('/settings?figma=error&reason=state_mismatch');
      return;
    }

    exchangeFigmaCode(code, getFigmaRedirectUri())
      .then(() => {
        router.replace('/settings?figma=connected');
      })
      .catch((err) => {
        const reason = err instanceof Error ? err.message : 'unknown';
        setErrorMessage(reason);
        router.replace(`/settings?figma=error&reason=${encodeURIComponent(reason)}`);
      });
  }, [params, router]);

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-sm text-destructive">Could not connect to Figma.</p>
        <p className="text-xs text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  return <SectionLoader label="Connecting to Figma…" />;
}

export default function FigmaOAuthCallbackPage() {
  return (
    <Suspense fallback={<SectionLoader label="Connecting to Figma…" />}>
      <CallbackInner />
    </Suspense>
  );
}
