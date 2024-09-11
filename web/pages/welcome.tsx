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
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { step, verified } = ctx.query;

  if (!session) {
    if (verified === "true") {
      // User just verified email, but session not set yet. Redirect to signin.
      return {
        redirect: {
          destination: "/signin?redirect=/welcome",
          permanent: false,
        },
      };
    }
    // No session and not just verified, redirect to home
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialSession: session,
      user: session.user,
      currentStep: step ? parseInt(step as string) : 1,
    },
  };
};
