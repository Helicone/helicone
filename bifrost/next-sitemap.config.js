const SITE_URL = "https://helicone.ai";

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
    "/signin",
    "/signup",
  ],
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
      },
    ],
  },
};
