import { useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import RedirectingScreen from "../components/templates/home/redirectingScreen";
import { isCustomerDomain } from "../lib/customerPortalHelpers";
import PublicMetaData from "../components/layout/public/publicMetaData";
import HomePage from "../components/templates/home/homePage";
import { getEncodedLekkoConfigs } from "@lekko/next-sdk";

export const Home = (props: { lekkoConfigs: string | undefined }) => {
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
          "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
        }
        ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
      >
        <HomePage lekkoConfigs={props.lekkoConfigs} />
      </PublicMetaData>
    </>
  );
};

export default Home;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const lekkoConfigs = await getEncodedLekkoConfigs();

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
    props: {
      lekkoConfigs,
    },
  };
};
