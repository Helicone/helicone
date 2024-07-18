import Head from "next/head";

interface AuthMetaDataProps {
  children: React.ReactNode;
  title: string;
  image?: string;
  description?: string;
}

const AuthMetaData = (props: AuthMetaDataProps) => {
  const { children, title, image, description } = props;

  // Detect if running on localhost
  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  // Conditionally set favicon path
  const faviconPath = isLocalhost ? "/static/logo-dev.png" : "/static/logo.png";

  const imageUrl =
    image ||
    "https://www.helicone.ai/_next/image?url=%2Fassets%2Flanding%2Fhelicone-mobile.webp&w=384&q=75";

  const descriptionFinal =
    description ||
    "Monitoring usage and costs for language models shouldn't be a hassle. With Helicone, you can focus on building your product, not building and maintaining your own analytics solution.";

  return (
    <>
      <Head>
        <title>{`${title} - Helicone`}</title>
        {/* Update the favicon path based on the environment */}
        <link rel="icon" href={faviconPath} />
        <meta property="og:title" content={title} />
        <meta
          property="og:description"
          name="description"
          content={descriptionFinal}
          key="desc"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={descriptionFinal} />
        <meta name="twitter:image" content={imageUrl} />
        <meta property="og:image" content={imageUrl} />
      </Head>
      {children}
    </>
  );
};

export default AuthMetaData;
