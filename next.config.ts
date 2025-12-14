/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Ensure feed routes are handled first
        {
          source: '/feed/:category/:postId',
          destination: '/feed/:category/:postId',
        },
      ],
    };
  },
};

module.exports = nextConfig;