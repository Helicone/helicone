const SITE_URL = "https://us.helicone.ai";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateIndexSitemap: true,
  generateRobotsTxt: true,
  exclude: [
    "/icon.ico",
    "*.js",
    "*.css",
    "*.xml",
    "*.json",
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
    "/event",
    "/microsoft-for-startups",
    "/reset-password",
    "/stats",
    "/test",
    "/webinar",
    "/blog",
    "/career",
    "/contact",
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: "Twitterbot", allow: "/" },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*?",
          "/*%",
          "/v1*",
          "/v2*",
          "/help/",
          "/oss/",
          "/api/",
          "/tags/",
          "/devops/",
          "/admin*",
        ],
      },
    ],
  },
  transform: async (config, path) => {
    if (path === "/icon.ico") {
      return null;
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
