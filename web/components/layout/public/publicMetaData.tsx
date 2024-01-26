import Head from "next/head";

interface PublicMetaDataProps {
  children: React.ReactNode;
}

const PublicMetaData = (props: PublicMetaDataProps) => {
  const { children } = props;

  return (
    <>
      <Head>
        <title>{`Helicone - The easiest way to monitor your LLM-application at scale`}</title>
        <link rel="icon" href="/static/helicone-logo.png" />
        <meta property="og:title" content={"Helicone"} />
        <meta content="https://helicone.ai" property="og:url" />
        <meta
          name="description"
          content="Pricing as simple as our code integration."
        />
        <meta
          property="og:description"
          content="Pricing as simple as our code integration."
        />
        <meta
          property="og:image"
          content={"https://www.helicone.ai/static/helicone-pricing.png"}
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://www.helicone.ai/static/helicone-pricing.png"
        />
      </Head>
      {children}
    </>
  );
};

export default PublicMetaData;
