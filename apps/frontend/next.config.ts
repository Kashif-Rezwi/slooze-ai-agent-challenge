import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Proxy all /api/* calls to the NestJS backend in development.
  // In production, set NEXT_PUBLIC_API_URL to the backend's public URL.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
