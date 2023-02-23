import { ArrowDownIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import MetaData from "../components/shared/metaData";
import OnboardingPage from "../components/templates/onboarding/onboardingPage";

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
  const supabase = createServerSupabaseClient(context);
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
