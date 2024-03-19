import Head from "next/head";

interface AuthMetaDataProps {
  children: React.ReactNode;
  title: string;
  image?: string;
}

const AuthMetaData = (props: AuthMetaDataProps) => {
  const { children, title, image } = props;

  // Detect if running on localhost
  const isLocalhost =
    typeof window !== "undefined" && window.location.hostname === "localhost";

  // Conditionally set favicon path
  const faviconPath = isLocalhost ? "/static/logo.png" : "/static/logo.png";

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
          content="Monitoring usage and costs for language models shouldn't be a hassle. With Helicone, you can focus on building your product, not building and maintaining your own analytics solution."
          key="desc"
        />
        <meta
          property="og:image"
          content={
            image
              ? image
              : "https://www.helicone.ai/_next/image?url=%2Fassets%2Flanding%2Fhelicone-mobile.webp&w=384&q=75"
          }
        />
      </Head>
      {children}
    </>
  );
};

export default AuthMetaData;
