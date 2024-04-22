import { useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import RedirectingScreen from "../components/templates/home/redirectingScreen";
import { isCustomerDomain } from "../lib/customerPortalHelpers";
import PublicMetaData from "../components/layout/public/publicMetaData";
import HomePage from "../components/templates/home/homePage";

export const Home = () => {
  return (
    <>
      <PublicMetaData
        description={
          "Meet the open-source observability platform built for LLM-developers. Whether you use OpenAI, Anthropic, or open-source models like Llama3, easily monitor your requests and prompts in real-time."
        }
        ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
      >
        <HomePage />
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

  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
