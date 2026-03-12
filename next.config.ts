import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/orcas-designer',
  transpilePackages: ["@boomi/exosphere"],
  images: { unoptimized: true },
};

export default nextConfig;
