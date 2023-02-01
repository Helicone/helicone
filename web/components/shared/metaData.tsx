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
        <title>
          {title} | Helicone - Providing meaningful and insightful analytics for
          your GPT-3 usage
        </title>
        <meta
          property="og:title"
          content="Helicone - Providing meaningful and insightful analytics for
          your GPT-3 usage"
        />
        <meta
          property="og:title"
          name="description"
          content="Monitoring your GPT-3 usage and costs shouldn't be a hassle. With Helicone, you can focus on building your product, not building and maintaining your own analytics solution."
          key="desc"
        />
        <link rel="icon" href="/assets/heli-logo.png" />
      </Head>
      {children}
    </>
  );
};

export default MetaData;
