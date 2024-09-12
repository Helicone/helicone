import MetaData from "../components/layout/public/authMetaData";
import WelcomePage from "../components/templates/welcome/welcomePage";
import "prismjs/themes/prism.css";
import { withAuthSSR } from "../lib/api/handlerWrappers";
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

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user, orgHasOnboarded, orgId },
  } = options;
  const { context } = options;

  if (orgHasOnboarded) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const step = context.query.step as string;

  return {
    props: {
      currentStep: step ? parseInt(step) : 1,
    },
  };
});
