import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'idea-portfolio-new-2025.s3.ap-northeast-2.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
