import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import BasePageV2 from "../components/shared/layout/basePageV2";
import MetaData from "../components/shared/metaData";
import WelcomePage from "../components/templates/welcome/welcomePage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { requestOverLimit } from "../lib/checkRequestLimit";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface WelcomeProps {}

const Welcome = (props: WelcomeProps) => {
  return (
    <MetaData title="Welcome">
      <WelcomePage />
    </MetaData>
  );
};

export default Welcome;
