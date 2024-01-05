import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import LoadingAnimation from "../components/shared/loadingAnimation";
import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import HomePageV2 from "../components/templates/home/homePageV2";
import Head from "next/head";

export const Home = () => {
  const router = useRouter();

  const user = useUser();
  const client = useSupabaseClient();
  if (user && user.email !== DEMO_EMAIL) {
    router.push("/dashboard");
    return (
      <div className="h-screen justify-center items-center flex">
        <div className="flex flex-col items-center gap-5">
          <LoadingAnimation title="Redirecting you to your dashboard..." />
          <div>Stuck here? Try signing out and back in</div>
          <button
            onClick={() => {
              client.auth.signOut();
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-32"
          >
            Sign out
          </button>

          <div>
            Still stuck here?{" "}
            <a
              href="https://discord.gg/2jZ6V7Yx"
              className="text-blue-500 hover:text-blue-700"
            >
              Join our Discord
            </a>{" "}
            or email us at{" "}
            <a
              href="mailto:support@helicone.ai"
              className="text-blue-500 hover:text-blue-700"
            >
              support@helicone.ai
            </a>
          </div>
        </div>
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

  return {
    props: {},
  };
};
