/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dnd-kit/core', '@dnd-kit/sortable', 'recharts'],
}

module.exports = nextConfig
