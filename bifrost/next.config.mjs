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
      {
        protocol: "https",
        hostname: "marketing-assets-helicone.s3.us-west-2.amazonaws.com"
      }
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
        source: "/community",
        destination: "/customers",
        permanent: true,
      },
      {
        source: "/blog/slash-llm-cost",
        destination: "/blog/monitor-and-optimize-llm-costs",
        permanent: true,
      },
      {
        source: "/blog/langsmith",
        destination: "/blog/langsmith-vs-helicone",
        permanent: true,
      },
      {
        source: "/blog/custom-properties",
        destination: "/blog/how-to-track-llm-user-feedback",
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
            value: "https://helicone.ai",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
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
