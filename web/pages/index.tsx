import { useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import HomePageV2 from "../components/templates/home/homePageV2";
import Head from "next/head";
import RedirectingScreen from "../components/templates/home/redirectingScreen";
import { isCustomerDomain } from "../lib/customerPortalHelpers";
import PublicMetaData from "../components/layout/public/publicMetaData";

export const Home = () => {
  const router = useRouter();

  const user = useUser();

  if (user && user.email !== DEMO_EMAIL) {
    router.push("/dashboard");
    return <RedirectingScreen />;
  }

  return (
    <>
      <PublicMetaData
        description={
          "The easiest way to monitor your LLM-application at scale."
        }
        ogImageUrl={"https://www.helicone.ai/static/helicone-landing.png"}
      >
        <HomePageV2 />
      </PublicMetaData>
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
