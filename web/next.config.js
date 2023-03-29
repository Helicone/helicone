/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      loader: "graphql-tag/loader",
    });
    config.resolve.extensions.push(".graphql"); // Add this line
    return config;
  },
  webpackDevMiddleware: (config) => {
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
};

module.exports = nextConfig;
