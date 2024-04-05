/** @type {import('next').NextConfig} */
const lekko = require("@lekko/webpack-loader");

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  webpack: (config) => {
    // if (process.env.NODE_ENV === "production") {
    config.module.rules.push({
      test: /lekko\/.*\.ts$/,
      loader: "@lekko/webpack-loader",
      options: {
        verbose: true,
      },
    });
    config.plugins.push(new lekko.LekkoEnvVarPlugin());

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
};

module.exports = nextConfig;
