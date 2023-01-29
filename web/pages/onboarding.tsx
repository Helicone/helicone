import { ArrowDownIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import NavBar from "../components/shared/navBar";
import OnboardingPage from "../components/templates/onboarding/onboardingPage";

interface OnboardingProps {
  origin: string;
  step?: number;
}

const Onboarding = (props: OnboardingProps) => {
  const { origin, step } = props;

  return <OnboardingPage step={step} origin={origin} />;
};

export default Onboarding;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, query } = context;
  const { step } = query;

  return {
    props: {
      origin: req.headers.host,
      step: parseInt(step as string),
    },
  };
}
