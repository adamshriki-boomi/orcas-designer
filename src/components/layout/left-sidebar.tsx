'use client';

import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Waves, Home, BotMessageSquare, PenLine, FlaskConical, Zap, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const SIDEBAR_WIDTH = 220;

const ExLeftmenubarAdjustable = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExLeftmenubarAdjustable })),
  { ssr: false }
);
const ExLeftmenubarLink = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExLeftmenubarLink })),
  { ssr: false }
);
const ExLeftmenubarDivider = dynamic(
  () => import('@boomi/exosphere').then((m) => ({ default: m.ExLeftmenubarDivider })),
  { ssr: false }
);

const navItems: { href: string; label: string; icon: React.ElementType }[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/prompt-generator', label: 'Prompt Generator', icon: BotMessageSquare },
  { href: '/ux-writer', label: 'UX Writer', icon: PenLine },
  { href: '/researcher', label: 'Researcher', icon: FlaskConical },
  { href: '/skills', label: 'Shared Skills', icon: Zap },
  { href: '/memories', label: 'Shared Memories', icon: BookOpen },
];

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  return (
    <aside
      className="sticky top-0 self-start h-screen shrink-0 z-40 relative bg-[var(--exo-color-background,#1a1a2e)] border-r border-[var(--exo-color-border,#2a2a3e)]"
      style={{ width: SIDEBAR_WIDTH }}
    >
      <ExLeftmenubarAdjustable
        expandWidth={SIDEBAR_WIDTH}
        collapseWidth={56}
        animated
        showAvatar={false}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-3 py-4 cursor-pointer"
          onClick={() => router.push('/')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/'); } }}
          role="button"
          tabIndex={0}
          aria-label="Go to dashboard"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Waves className="size-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-sm font-bold tracking-tight overflow-hidden whitespace-nowrap">
            Orcas Designer
          </span>
        </div>

        <ExLeftmenubarDivider />

        {/* Nav Links */}
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <ExLeftmenubarLink
              key={item.href}
              label={item.label}
              selected={isActive}
              tooltipText={item.label}
              onItemSelection={() => router.push(item.href)}
            >
              <span slot="icon" className="flex items-center justify-center">
                <Icon className="size-[18px]" />
              </span>
            </ExLeftmenubarLink>
          );
        })}

        <ExLeftmenubarDivider />
        <ExLeftmenubarLink
          label="Settings"
          selected={pathname === '/settings'}
          tooltipText="Settings"
          onItemSelection={() => router.push('/settings')}
        >
          <span slot="icon" className="flex items-center justify-center">
            <SettingsIcon className="size-[18px]" />
          </span>
        </ExLeftmenubarLink>

      </ExLeftmenubarAdjustable>

      {/* User display — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 pb-3 px-2">
        {user && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg overflow-hidden">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="size-6 rounded-full shrink-0" />
            ) : (
              <div className="size-6 rounded-full shrink-0 bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                {(user.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs truncate text-muted-foreground">{user.email}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
