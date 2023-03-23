import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import LoadingAnimation from "../components/shared/loadingAnimation";
import MetaData from "../components/shared/metaData";
import HomePage from "../components/templates/home/homePage";
import { DEMO_EMAIL } from "../lib/constants";
import { redirectIfLoggedIn } from "../lib/redirectIdLoggedIn";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;

  return (
    <MetaData title="Home">
      <HomePage />
    </MetaData>
  );
};

export default Home;
