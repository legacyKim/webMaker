import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3gdgz5qdqee20.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
