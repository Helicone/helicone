import { useUser } from "@supabase/auth-helpers-react";

import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import LoadingAnimation from "../components/shared/loadingAnimation";
import MetaData from "../components/shared/metaData";
import { DEMO_EMAIL } from "../lib/constants";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import HomePageV2 from "../components/templates/home/homePageV2";

interface HomeProps {}

const Home = (props: HomeProps) => {
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
    <MetaData title="Home">
      <HomePageV2 />
    </MetaData>
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
