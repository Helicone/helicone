const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://us.helicone.ai";

/**
 * Web app sitemap configuration
 *
 * This configuration is for the dashboard/app (us.helicone.ai) which primarily
 * contains authenticated pages. Most routes are excluded as they require login.
 *
 * For the marketing site sitemap, see bifrost/next-sitemap.config.js
 */

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateIndexSitemap: true,
  generateRobotsTxt: true,
  // Exclude authenticated and internal routes
  exclude: [
    // Static assets
    "/icon.ico",
    "*.js",
    "*.css",
    "*.xml",
    "*.json",
    // Admin and dashboard routes (authenticated)
    "/admin*",
    "/dashboard*",
    "/alerts",
    "/cache",
    "/enterprise*",
    "/fine-tune",
    "/models",
    "/playground",
    "/prompts*",
    "/properties",
    "/requests",
    "/sessions*",
    "/settings",
    "/users*",
    "/vault",
    "/webhooks",
    "/welcome",
    "/developer",
    // Internal/utility routes
    "/event",
    "/microsoft-for-startups",
    "/reset-password",
    "/stats",
    "/test",
    "/webinar",
    // Marketing content is on bifrost (www.helicone.ai)
    "/blog",
    "/career",
    "/contact",
  ],
  robotsTxtOptions: {
    policies: [
      // Allow Twitterbot for social previews
      { userAgent: "Twitterbot", allow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Exclude URLs with query params
          "/*?",
          "/*%",
          // API routes
          "/v1*",
          "/v2*",
          "/api/",
          // Internal paths
          "/help/",
          "/oss/",
          "/tags/",
          "/devops/",
          "/admin*",
        ],
      },
    ],
  },
  transform: async (config, path) => {
    // Skip icon files
    if (path === "/icon.ico") {
      return null;
    }

    // Set appropriate priority based on path
    let priority = 0.7;
    if (path === "/" || path === "") {
      priority = 1.0;
    } else if (path.startsWith("/signin") || path.startsWith("/signup")) {
      priority = 0.8;
    }

    return {
      loc: path,
      changefreq: config.changefreq || "weekly",
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
