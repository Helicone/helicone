const SITE_URL = "https://helicone.ai";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateIndexSitemap: true,
  generateRobotsTxt: true,
  changefreq: "monthly",
  robotsTxtOptions: {
    additionalSitemaps: ["https://docs.helicone.ai/sitemap.xml"],
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
          "/icon.ico",
        ],
        exclude: ["/icon.ico", "*.js", "*.css", "*.xml", "*.json"],
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
