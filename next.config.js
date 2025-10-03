/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    
    // Disable ESLint during builds
    eslint: {
      ignoreDuringBuilds: true,
    },
    
    // Disable TypeScript errors during builds
    typescript: {
      ignoreBuildErrors: true,
    },
    
    // Disable security headers for HTTP development
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            // Remove HTTPS enforcement
            // {
            //   key: 'Strict-Transport-Security',
            //   value: 'max-age=31536000; includeSubDomains',
            // },
          ],
        },
      ]
    },
    
    // API rewrites for backend
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "http://172.17.128.145:3836/v1/api/:path*",
        },
      ]
    },
    
  serverExternalPackages: [],
}
  module.exports = nextConfig
  
