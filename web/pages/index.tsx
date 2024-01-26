import { useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import HomePageV2 from "../components/templates/home/homePageV2";
import Head from "next/head";
import RedirectingScreen from "../components/templates/home/redirectingScreen";
import { isCustomerDomain } from "../lib/customerPortalHelpers";

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
        <link rel="icon" href="/static/helicone-logo.png" />
        <meta property="og:title" content={"Helicone"} />
        <meta content="https://helicone.ai" property="og:url" />
        <meta
          name="description"
          content="The easiest way to monitor your LLM-application at scale."
        />
        <meta
          property="og:description"
          content="The easiest way to monitor your LLM-application at scale."
        />
        <meta
          property="og:image"
          content={"https://www.helicone.ai/static/helicone-cover.png"}
          //             "https://www.helicone.ai/_next/image?url=%2Fstatic%2Fhelicone-cover.png&w=1600&q=75"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        {/* <meta name="twitter:title" content="Helicone" />
        <meta
          name="twitter:description"
          content="The easiest way to monitor your LLM-application at scale."
        /> */}
        <meta
          name="twitter:image"
          content="https://www.helicone.ai/static/helicone-cover.png"
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
  if (isCustomerDomain(context.req.headers.host ?? "")) {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }

  const supabase = new SupabaseServerWrapper(context).getClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    props: {},
  };
};
