import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import AuthLayout from "../components/shared/layout/authLayout";
import BasePageV2 from "../components/shared/layout/basePageV2";
import LoadingAnimation from "../components/shared/loadingAnimation";
import MetaData from "../components/shared/metaData";
import HomePage from "../components/templates/home/homePage";
import { DEMO_EMAIL } from "../lib/constants";
import { redirectIfLoggedIn } from "../lib/redirectIdLoggedIn";
import { Octokit } from "@octokit/core";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;
  const router = useRouter();

  const user = useUser();
  useEffect(() => {}, []);

  return (
    <MetaData title="Home">
      <BasePageV2>
        <div>Hello</div>
        <div>Hello</div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
