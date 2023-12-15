import { useUser } from "@supabase/auth-helpers-react";

import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import LoadingAnimation from "../components/shared/loadingAnimation";
import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import HomePageV2 from "../components/templates/home/homePageV2";
import Head from "next/head";

interface HomeProps {}

export const Home = (props: HomeProps) => {
  const {} = props;
  const router = useRouter();

  const user = useUser();

  if (user && user.email !== DEMO_EMAIL) {
    router.push("/dashboard");
    return (
      <div className="h-screen justify-center items-center flex">
        <LoadingAnimation title="Redirecting you to your dashboard..." />
      </div>
    );
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

  if (session) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user", session.user.id)
      .single();
    if (data === null) {
      return {
        redirect: {
          destination: "/welcome",
          permanent: false,
        },
      };
    }
  }
  return {
    props: {},
  };
};
