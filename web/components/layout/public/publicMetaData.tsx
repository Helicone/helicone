import Head from "next/head";

interface PublicMetaDataProps {
  description: string;
  ogImageUrl: string;
  children: React.ReactNode;
}

const PublicMetaData = (props: PublicMetaDataProps) => {
  const { description, ogImageUrl, children } = props;

  return (
    <>
      <Head>
        <title>{`Helicone - The easiest way to monitor your LLM-application at scale`}</title>
        <link rel="icon" href="/static/helicone-logo.png" />
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
