const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const { configureRuntimeEnv } = require("next-runtime-env/build/configure");

configureRuntimeEnv();

// Check if we're in lightning mode
const isLightningMode = process.env.DISABLE_API_CALLS === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Speed up development by disabling strict mode
  reactStrictMode: false,
  // Use SWC minifier for faster builds
  swcMinify: true,
  // Improve development performance
  onDemandEntries: {
    // Keep pages in memory longer (25 seconds)
    maxInactiveAge: isLightningMode ? 60 * 1000 : 25 * 1000, // Even longer in lightning mode
    // Load more pages simultaneously
    pagesBufferLength: isLightningMode ? 10 : 5, // More pages in lightning mode
  },
  // Disable source maps in development
  productionBrowserSourceMaps: false,
  // Speed up image processing
  images: {
    // Disable image optimization in development
    unoptimized: process.env.NODE_ENV !== "production",
  },
  // Handle redirects
  async redirects() {
    return [
      {
        source: "/api/graphql/download-schema",
        destination: "/api-public-schema.graphql",
        permanent: true,
      },
    ];
  },
  // Handle rewrites
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
  // Experimental features - only use valid ones that don't require critters in dev mode
  experimental: {
    // Disable CSS optimization in development to avoid critters issues
    optimizeCss: process.env.NODE_ENV === "production",
    // Allocate memory efficiently
    memoryBasedWorkersCount: true,
    // Improve bundle splitting (valid option)
    optimizePackageImports: [
      "react",
      "react-dom",
      "lucide-react",
      "@radix-ui",
      "recharts",
    ],
    // Simpler lightning mode optimizations
    ...(isLightningMode &&
      {
        // Only use stable features in lightning mode
      }),
  },
};

module.exports = withBundleAnalyzer(nextConfig);

// Injected content via Sentry wizard below
if (process.env.REGION === "us") {
  const { withSentryConfig } = require("@sentry/nextjs");

  module.exports = withSentryConfig(module.exports, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "helicone-ai",
    project: "javascript-nextjs",
    authToken: process.env.SENTRY_AUTH_TOKEN,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  });
}
