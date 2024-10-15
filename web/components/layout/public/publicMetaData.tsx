import Head from "next/head";

interface PublicMetaDataProps {
  description: string;
  ogImageUrl: string;
  children: React.ReactNode;
}

export const faqs = [
  {
    question: "Is there a latency impact to my requests with Helicone's Proxy?",
    answer:
      "Helicone leverages Cloudflare’s global network of servers as proxies for efficient web traffic routing. Cloudflare workers maintain extremely low latency through their worldwide distribution. This results in a fast and reliable proxy for your LLM requests with less than a fraction of a millisecond of latency impact.",
  },
  {
    question: "Do you offer a self-hosted or manage-hosted solution?",
    answer:
      "Our recommended solution is to use our cloud service, but we do offer a dedicated manage-hosted solution for enterprise customers. Please contact us at sales@helicone.ai for more information.",
  },
  {
    question: "I do not want to use the proxy, can I still use Helicone?",
    answer:
      "Yes, you can use Helicone without the proxy. We have packages for Python and Node.js that you can use to send data to Helicone. Visit our documentation page to learn more.",
  },
  // More questions...
];

const PublicMetaData = (props: PublicMetaDataProps) => {
  const { description, ogImageUrl, children } = props;

  // Detect if running on localhost
  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  // Conditionally set favicon path
  const faviconPath = isLocalhost
    ? "/static/logo-dev.png"
    : "/static/logo.webp";

  return (
    <>
      <Head>
        <title>{`Helicone - Open-Source Generative AI Platform for Developers`}</title>
        {/* Update the favicon path based on the environment */}
        <link rel="icon" href={faviconPath} />
        <link rel="canonical" href="https://www.helicone.ai/" />
        <meta property="og:title" content={"Helicone"} />
        <meta content="https://helicone.ai" property="og:url" />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImageUrl} />
        {/* FIX THIS */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "http://schema.org",
            "@type": "WebSite",
            url: "https://www.helicone.ai",
            name: "Helicone",
            description: "Observability platform for LLM-developers",
            publisher: {
              "@type": "Organization",
              name: "Helicone",
              url: "https://www.helicone.ai",
              logo: "https://www.helicone.ai/static/logo.webp",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "support@helicone.ai",
              },
            },
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "http://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          })}
        </script>
      </Head>
      {children}
    </>
  );
};

export default PublicMetaData;
