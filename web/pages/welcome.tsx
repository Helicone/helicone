import { GetServerSidePropsContext } from "next";
import MetaData from "../components/layout/public/authMetaData";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import WelcomePage from "../components/templates/welcome/welcomePage";
import "prismjs/themes/prism.css";
interface WelcomeProps {
  currentStep: number;
}

const Welcome = (props: WelcomeProps) => {
  const { currentStep } = props;
  return (
    <MetaData title="Welcome">
      <WelcomePage currentStep={currentStep} />
    </MetaData>
  );
};

export default Welcome;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabaseClient = new SupabaseServerWrapper(ctx);
  const currentSession = await supabaseClient.client.auth.getSession();

  console.log("currentSession", currentSession);

  const { data, error } = await supabaseClient.getUserAndOrg();

  if (error !== null || !data.orgId || !data.userId) {
    return {
      redirect: {
        destination: "/signin?unauthorized=true",
        permanent: false,
      },
    };
  }

  if (data.orgHasOnboarded) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const { step } = ctx.query;

  return {
    props: {
      initialSession: currentSession,
      user: currentSession.data.session?.user,
      currentStep: step ? parseInt(step as string) : 1,
    },
  };
};
