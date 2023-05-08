import { GetServerSidePropsContext } from "next";
import MetaData from "../components/shared/metaData";
import OnboardingPage from "../components/templates/onboarding/onboardingPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface OnboardingProps {
  origin: string;
  step?: number;
}

const Onboarding = (props: OnboardingProps) => {
  const { origin, step } = props;

  return (
    <MetaData title="Onboarding">
      <OnboardingPage step={step} origin={origin} />
    </MetaData>
  );
};

export default Onboarding;

export async function getServerSideProps(context: GetServerSidePropsContext) {
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

  const { req, query } = context;
  const { step } = query;

  return {
    props: {
      origin: req.headers.host,
      step: parseInt(step as string),
    },
  };
}
