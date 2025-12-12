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

/**
 * Get model pages from the model registry API
 * Fetches from the production Jawn service to get the list of models
 */
const getModelPages = async () => {
  // Use the production API URL for sitemap generation
  const JAWN_API_URL = process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "https://api.helicone.ai";

  try {
    const response = await fetch(`${JAWN_API_URL}/v1/public/model-registry/models`);

    if (!response.ok) {
      console.warn(`Failed to fetch models from API: ${response.status}`);
      return [];
    }

    const result = await response.json();

    if (!result.data?.models || !Array.isArray(result.data.models)) {
      console.warn("Invalid response from model registry API");
      return [];
    }

    const modelPages = result.data.models.map((model) =>
      `/model/${encodeURIComponent(model.id)}`
    );

    console.log(`✨ [next-sitemap] Added ${modelPages.length} model pages to sitemap`);
    return modelPages;
  } catch (error) {
    console.warn("Failed to fetch model pages for sitemap:", error.message);
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
    const modelPages = await getModelPages();
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
        priority: 0.7,
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
