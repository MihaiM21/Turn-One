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
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://turnonehub.com',
  },
  
  // SEO optimizations
  generateEtags: true,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
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
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Redirect www subdomain to non-www canonical domain
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.turnonehub.com',
          },
        ],
        destination: 'https://turnonehub.com/:path*',
        permanent: true,
      },
      // Handle legacy auth routes
      {
        source: '/auth/register',
        destination: '/auth/signup',
        permanent: true,
      },
      {
        source: '/cdn-cgi/email-protection',
        destination: '/contact',
        permanent: false,
      },
      {
        source: '/cdn-cgi/l/email-protection',
        destination: '/contact',
        permanent: false,
      },
    ];
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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
