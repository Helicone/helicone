import { GetServerSidePropsContext } from "next";
import MetaData from "../components/layout/public/authMetaData";
import WelcomePage from "../components/templates/welcome/welcomePage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

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
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const { step } = ctx.query;

  return {
    props: {
      initialSession: session,
      user: session.user,
      currentStep: step ? parseInt(step as string) : 0,
    },
  };
};
