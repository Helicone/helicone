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
};

export default nextConfig;
