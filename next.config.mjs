/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', 'recharts'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true, // Added from updates
  },
  compress: true,
  poweredByHeader: false,
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Split vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Split UI components
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 20,
          },
          // Split dashboard components
          dashboard: {
            test: /[\\/]components[\\/]dashboard[\\/]/,
            name: 'dashboard',
            chunks: 'all',
            priority: 15,
          },
        },
      }
    }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true, // Added from updates
  },
  typescript: {
    ignoreBuildErrors: true, // Added from updates
  },
}

export default nextConfig
