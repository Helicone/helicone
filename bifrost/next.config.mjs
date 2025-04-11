import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  transpilePackages: ["next-mdx-remote"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.shields.io",
      },
      {
        protocol: "https",
        hostname: "api.producthunt.com",
      },
      {
        protocol: "https",
        hostname: "dailybaileyai.com",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
      },
      {
        protocol: "https",
        hostname: "www.sequoiacap.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/onboarding",
        destination: "https://us.helicone.ai/",
        permanent: true,
      },
      {
        source: "/selfhost",
        destination:
          "https://docs.helicone.ai/getting-started/self-host/overview",
        permanent: true,
      },
      {
        source: "/video",
        destination: "https://www.youtube.com/@helicone",
        permanent: true,
      },
      {
        source: "/roadmap",
        destination: "https://us.helicone.ai/roadmap",
        permanent: true,
      },
      {
        source: "/blog/slash-llm-cost",
        destination: "/blog/monitor-and-optimize-llm-costs",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/rss/changelog.xml",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Set your origin
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  swcMinify: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    modern: true,
    modernBrowsers: true,
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkToc],
    rehypePlugins: [
      rehypeHighlight,
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  },
});

export default withMDX(nextConfig);
