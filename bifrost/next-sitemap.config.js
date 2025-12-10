const SITE_URL = "https://www.helicone.ai";
const fs = require("fs");
const path = require("path");

/**
 * Safely reads a directory and returns its contents.
 * Returns an empty array if the directory doesn't exist or can't be read.
 * @param {string} dirPath - The path to the directory
 * @returns {string[]} - Array of file/folder names
 */
const safeReadDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      console.warn(`[next-sitemap] Directory not found: ${dirPath}`);
      return [];
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    // Filter to only include directories (blog posts and changelog entries are folders)
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    console.error(`[next-sitemap] Error reading directory ${dirPath}:`, error.message);
    return [];
  }
};

/**
 * Gets the last modified time of a file or directory.
 * @param {string} filePath - The path to check
 * @returns {Date|null} - The last modified date or null if unavailable
 */
const getLastModified = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
};

/**
 * Gets all blog post paths with their metadata.
 * Blog posts are stored in app/blog/blogs/{slug}/src.mdx
 */
const getBlogPosts = () => {
  const blogDir = path.join(process.cwd(), "app", "blog", "blogs");
  const slugs = safeReadDir(blogDir);

  return slugs.map((slug) => {
    const srcPath = path.join(blogDir, slug, "src.mdx");
    const lastmod = getLastModified(srcPath) || getLastModified(path.join(blogDir, slug));

    return {
      loc: `/blog/${slug}`,
      lastmod: lastmod ? lastmod.toISOString() : new Date().toISOString(),
      changefreq: "weekly",
      priority: 0.7,
    };
  });
};

/**
 * Gets all changelog entry paths with their metadata.
 * Changelog entries are stored in app/changelog/changes/{slug}/
 */
const getChangelogEntries = () => {
  const changelogDir = path.join(process.cwd(), "app", "changelog", "changes");
  const slugs = safeReadDir(changelogDir);

  return slugs.map((slug) => {
    const entryDir = path.join(changelogDir, slug);
    const lastmod = getLastModified(entryDir);

    return {
      loc: `/changelog/${slug}`,
      lastmod: lastmod ? lastmod.toISOString() : new Date().toISOString(),
      changefreq: "monthly",
      priority: 0.6,
    };
  });
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

    console.log(`[next-sitemap] Found ${blogPosts.length} blog posts`);
    console.log(`[next-sitemap] Found ${changelogEntries.length} changelog entries`);

    return [...blogPosts, ...changelogEntries];
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
