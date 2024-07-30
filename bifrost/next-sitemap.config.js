const SITE_URL = "https://www.helicone.ai";
const fs = require("fs");
const path = require("path");

const getBlogPosts = () => {
  const blogDir = path.join(process.cwd(), "app", "blog", "blogs");
  return fs.readdirSync(blogDir).map((file) => `/blog/${file}`);
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
    return blogPosts.map((path) => ({
      loc: path,
      changefreq: "weekly",
      priority: 0.7,
    }));
  },
  // ... rest of the existing configuration
};
