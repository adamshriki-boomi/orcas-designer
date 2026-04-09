'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LeftSidebar } from './left-sidebar';

const PUBLIC_PATHS = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicPath) {
      router.replace('/login');
    } else if (user && isPublicPath) {
      router.replace('/');
    }
  }, [user, loading, isPublicPath, router]);

  // Loading state
  if (loading) return null;

  // Unauthenticated on public page (login) — render without sidebar
  if (!user && isPublicPath) {
    return <>{children}</>;
  }

  // Unauthenticated on protected page — redirecting, show nothing
  if (!user && !isPublicPath) return null;

  // Authenticated on public page — redirecting, show nothing
  if (user && isPublicPath) return null;

  // Authenticated on protected page — full app shell with sidebar
  return (
    <div className="flex min-h-screen">
      <LeftSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
