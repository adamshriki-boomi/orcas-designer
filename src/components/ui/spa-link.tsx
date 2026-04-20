'use client';

import * as React from 'react';

/**
 * Navigates to a dynamic route in a static-exported app.
 *
 * Next.js `<Link>` prefetches every visible target on hover/idle, which sends
 * HEAD requests. In our static-export build (`next build && output: 'export'`
 * on GitHub Pages) only the routes listed in `generateStaticParams()` exist as
 * static HTML. Dynamic IDs resolve via the SPA-redirect in `scripts/spa-redirect-404.html`.
 * Prefetching an unbuilt `/<section>/<id>` therefore produces a 404 console
 * error, and the brief error flash users see on click comes from the same
 * prefetch race. Using a plain `<a>` skips the prefetch entirely.
 *
 * Use this for any route rendered via `[id]/page.tsx`. For static routes like
 * `/researcher/new` continue to use `next/link`.
 */
export function SpaLink({
  href,
  children,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const resolved = href.startsWith('http') ? href : `${basePath}${href}`;
  return (
    <a href={resolved} className={className} {...props}>
      {children}
    </a>
  );
}
