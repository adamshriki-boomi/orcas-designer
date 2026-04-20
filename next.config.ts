import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = '/orcas-designer';

const nextConfig: NextConfig = {
  ...(isProd && { output: 'export' }),
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  transpilePackages: ["@boomi/exosphere"],
  images: { unoptimized: true },
  // Allow e2e/CI runs to use an isolated build cache so a concurrent
  // `next dev` on :3000 doesn't fight for .next/dev/lock or a shared
  // Turbopack cache. Playwright sets NEXT_DIST_DIR=.next-e2e.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  ...(!isProd && {
    async redirects() {
      return [
        { source: '/', destination: basePath, basePath: false, permanent: false },
      ];
    },
  }),
};

export default nextConfig;
