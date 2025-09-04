/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: "http://172.17.128.145:3836/v1/api/:path*", // inside Docker network
        },
      ]
    },
  }
  
  module.exports = nextConfig
  