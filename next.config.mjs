/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',   // Optimized build for Node.js container (Railway/Docker)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
