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

const getModelPages = () => {
  const modelListPath = path.join(process.cwd(), "generated", "model-list.json");

  if (!fs.existsSync(modelListPath)) {
    console.warn("Warning: model-list.json not found. Model pages will not be included in sitemap.");
    return [];
  }

  try {
    const modelListData = JSON.parse(fs.readFileSync(modelListPath, "utf-8"));
    return modelListData.models.map((modelId) => `/model/${encodeURIComponent(modelId)}`);
  } catch (error) {
    console.error("Error reading model-list.json:", error);
    return [];
  }
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
    const modelPages = getModelPages();

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
      ...modelPages.map((path) => ({
        loc: path,
        changefreq: "weekly",
        priority: 0.8,
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
