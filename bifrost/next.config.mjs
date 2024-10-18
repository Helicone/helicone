/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/onboarding",
        destination: "https://us.helicone.ai/",
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
    ];
  },
  images: {
    domains: ["api.producthunt.com"],
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
};

export default nextConfig;
