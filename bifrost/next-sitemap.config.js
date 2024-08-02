const SITE_URL = "https://www.helicone.ai";
const fs = require("fs");
const path = require("path");

const getBlogPosts = () => {
  const blogDir = path.join(process.cwd(), "app", "blog", "blogs");
  return fs.readdirSync(blogDir).map((file) => `/blog/${file}`);
};

const getChangelogEntries = () => {
  const changelogDir = path.join(process.cwd(), "app", "changelog", "changes");
  return fs.readdirSync(changelogDir).map((file) => `/changelog/${file}`);
};

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
  additionalPaths: async (config) => {
    const blogPosts = getBlogPosts();
    const changelogEntries = getChangelogEntries();
    return [
      ...blogPosts.map((path) => ({
        loc: path,
        changefreq: "weekly",
        priority: 0.7,
      })),
      ...changelogEntries.map((path) => ({
        loc: path,
        changefreq: "weekly",
        priority: 0.6,
      })),
    ];
  },
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
