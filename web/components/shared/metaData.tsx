import Head from "next/head";

interface MetaDataProps {
  children: React.ReactNode;
  title: string;
}

const MetaData = (props: MetaDataProps) => {
  const { children, title } = props;

  return (
    <>
      <Head>
        <title>{`${title} | Helicone - Observability for Generative AI`}</title>
        <link rel="icon" href="/assets/landing/helicone-mobile.webp" />
        <meta
          property="og:title"
          content="Helicone | Observability for Generative AI"
        />
        <meta
          property="og:description"
          name="description"
          content="Monitoring usage and costs for language models shouldn't be a hassle. With Helicone, you can focus on building your product, not building and maintaining your own analytics solution."
          key="desc"
        />
        <meta property="og:image" content="/assets/landing/helicone.webp" />
      </Head>
      {children}
    </>
  );
};

export default MetaData;
