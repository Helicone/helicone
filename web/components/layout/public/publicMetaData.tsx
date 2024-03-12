import Head from "next/head";

interface PublicMetaDataProps {
  description: string;
  ogImageUrl: string;
  children: React.ReactNode;
}

const PublicMetaData = (props: PublicMetaDataProps) => {
  const { description, ogImageUrl, children } = props;

  // Detect if running on localhost
  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  // Conditionally set favicon path
  const faviconPath = isLocalhost
    ? "/assets/landing/helicone-dev.png"
    : "/static/helicone-logo.png";

  return (
    <>
      <Head>
        <title>{`Helicone - Open-Source Generative AI Platform for Developers`}</title>
        {/* Update the favicon path based on the environment */}
        <link rel="icon" href={faviconPath} />
        <meta property="og:title" content={"Helicone"} />
        <meta content="https://helicone.ai" property="og:url" />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>
      {children}
    </>
  );
};

export default PublicMetaData;
