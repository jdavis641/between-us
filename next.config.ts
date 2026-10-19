import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      {
        source: '/signin',
        destination: '/login',
      },
    ];
  },
};
export default nextConfig;