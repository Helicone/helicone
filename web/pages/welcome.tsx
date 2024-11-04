import { GetServerSidePropsContext } from "next";
import MetaData from "../components/layout/public/authMetaData";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import WelcomePage from "../components/templates/welcome/welcomePage";
// import "prismjs/themes/prism.css";
interface WelcomeProps {
  currentStep: number;
}

const Welcome = (props: WelcomeProps) => {
  const { currentStep } = props;
  return (
    <MetaData title="Welcome">
      {/* <div>Welcome</div> */}
      <WelcomePage currentStep={currentStep} />
    </MetaData>
  );
};

export default Welcome;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabaseClient = new SupabaseServerWrapper(ctx);
  const supabase = supabaseClient.getClient();

  const currentSession = await supabase.auth.refreshSession();

  if (!currentSession.data.session?.user)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const { data, error } = await supabaseClient.getUserAndOrg();

  if (error !== null || !data.orgId || !data.userId) {
    return {
      redirect: {
        destination: "/signin?unauthorized=true",
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
