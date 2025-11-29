/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/rayzum' : '',
  trailingSlash: true,
  // Generate a fallback 404 page for client-side routing
  distDir: 'out',
}

module.exports = nextConfig
