/** @type {import('next').NextConfig} */
const nextConfig = {
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