import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  
  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  
  // Environment variables
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.t1f1.com/api',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.formula1.com',
      },
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
      }
    ],
  },
};

export default nextConfig;
