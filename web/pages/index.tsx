import { useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import HomePageV2 from "../components/templates/home/homePageV2";
import Head from "next/head";
import RedirectingScreen from "../components/templates/home/redirectingScreen";

export const Home = () => {
  const router = useRouter();

  const user = useUser();

  if (user && user.email !== DEMO_EMAIL) {
    router.push("/dashboard");
    return <RedirectingScreen />;
  }

  return (
    <>
      <Head>
        <title>{`Helicone - The easiest way to monitor your LLM-application at scale`}</title>
        <link rel="icon" href="/assets/landing/helicone-mobile.webp" />
        <meta
          property="og:title"
          content={
            "Helicone - The easiest way to monitor your LLM-application at scale"
          }
        />
        <meta
          property="og:description"
          name="description"
          content="Monitoring usage and costs for language models shouldn't be a hassle. With Helicone, you can focus on building your product, not building and maintaining your own analytics solution."
          key="desc"
        />
        <meta
          property="og:image"
          content={
            "https://www.helicone.ai/_next/image?url=%2Fassets%2Flanding%2Fhelicone-mobile.webp&w=384&q=75"
          }
        />
      </Head>
      <HomePageV2 />
    </>
  );
};

export default Home;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    props: {},
  };
};
