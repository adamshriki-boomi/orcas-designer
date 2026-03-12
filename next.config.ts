import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = '/orcas-designer';

const nextConfig: NextConfig = {
  ...(isProd && { output: 'export' }),
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  transpilePackages: ["@boomi/exosphere"],
  images: { unoptimized: true },
  ...(!isProd && {
    async redirects() {
      return [
        { source: '/', destination: basePath, basePath: false, permanent: false },
      ];
    },
  }),
};

export default nextConfig;
