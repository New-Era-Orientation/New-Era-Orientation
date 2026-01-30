import type { NextConfig } from "next";

// Check if building for mobile/desktop (static export)
const isStaticBuild = process.env.BUILD_TARGET === "static";

const nextConfig: NextConfig = {
  // Output mode:
  // - "export" for Capacitor/Tauri static builds
  // - "standalone" for Docker/server deployments (so .next/standalone exists)
  ...(isStaticBuild
    ? {
        output: "export",
        distDir: "out",
        images: {
          unoptimized: true, // Required for static export
        },
      }
    : {
        output: "standalone",
      }),

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
    // For static export, use unoptimized
    ...(isStaticBuild && { unoptimized: true }),
  },

  // Performance optimizations
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ["lucide-react"],
  },

  // Compression
  compress: true,

  // Headers for caching (only for server mode)
  ...(!isStaticBuild && {
    async headers() {
      return [
        {
          source: "/:all*(svg|jpg|png|webp|avif|ico)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        {
          source: "/_next/static/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
