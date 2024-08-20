/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      loader: "graphql-tag/loader",
    });
    config.resolve.extensions.push(".graphql"); // Add this line
    return config;
  },
  async redirects() {
    return [
      {
        source: "/api/graphql/download-schema",
        destination: "/api-public-schema.graphql",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
  experimental: {
    appDir: true,
    runtime: "experimental-edge",
  },
};

module.exports = nextConfig;
